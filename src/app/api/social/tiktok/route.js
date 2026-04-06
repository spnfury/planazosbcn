import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req) {
  try {
    const { videoUrl, caption } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    const sessionIdCookie = process.env.TIKTOK_SESSIONID;
    if (!sessionIdCookie) {
      return NextResponse.json({ error: 'TIKTOK_SESSIONID environment variable is missing' }, { status: 400 });
    }

    // Since puppeteer-core needs an executable, we need to find it for local environments (Mac/Linux/Windows).
    // In Vercel, this won't work out of the box without @sparticuz/chromium.
    let executablePath = '';
    const platform = os.platform();
    if (platform === 'darwin') {
      executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else if (platform === 'win32') {
      executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    } else {
      executablePath = '/usr/bin/google-chrome'; // Linux
    }

    // Download the video temporarily to local disk because Puppeteer needs to upload a File
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
        throw new Error("Failed to fetch video for TikTok");
    }
    const buffer = Buffer.from(await videoResponse.arrayBuffer());
    
    // Create temp file
    const tempFilePath = path.join(os.tmpdir(), `tiktok-upload-${Date.now()}.mp4`);
    await fs.writeFile(tempFilePath, buffer);

    try {
        const browser = await puppeteer.launch({
            executablePath,
            headless: true, // run in headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Set the cookie
        await page.setCookie({
            name: 'sessionid',
            value: sessionIdCookie,
            domain: '.tiktok.com',
            path: '/',
            httpOnly: true,
            secure: true
        });

        // Navigate to TikTok Upload Page
        await page.goto('https://www.tiktok.com/creator-center/upload?from=pc', { waitUntil: 'networkidle2' });

        // Wait for the iframe. TikTok usually puts the upload inside an iframe.
        // NOTE: TikTok's web UI changes very frequently. This automation selector might need updates over time.
        const iframeElement = await page.waitForSelector('iframe', { timeout: 15000 }).catch(() => null);
        
        const frame = iframeElement ? await iframeElement.contentFrame() : page;
        
        // Wait for file input and upload file
        const fileInput = await frame.waitForSelector('input[type="file"]', { timeout: 15000 });
        await fileInput.uploadFile(tempFilePath);
        
        // Wait for upload to complete
        await frame.waitForFunction(() => {
            // Rough heuristic: when the video element shows up or progress is gone
            return document.querySelector('video') !== null;
        }, { timeout: 60000 });

        // Enter caption if provided (usually in a contenteditable div)
        if (caption) {
            const captionEditor = await frame.waitForSelector('.public-DraftEditor-content, [contenteditable="true"]', { timeout: 5000 });
            if (captionEditor) {
                // Clear existing
                await captionEditor.click({ clickCount: 3 });
                await captionEditor.press('Backspace');
                await captionEditor.type(caption, { delay: 50 });
            }
        }

        // Click the post button
        // Usually contains text "Post" or "Publicar" depending on locale.
        const postButton = await frame.$x('//button[contains(., "Post") or contains(., "Publicar")]');
        if (postButton.length > 0) {
            await postButton[0].click();
            // Wait a bit for the post request to go through
            await new Promise(r => setTimeout(r, 5000));
        } else {
             throw new Error("Could not find Post button");
        }

        await browser.close();
        await fs.unlink(tempFilePath); // Cleanup

        return NextResponse.json({ success: true, message: 'TikTok upload scheduled successfully' });
    } catch (automationError) {
        // Cleanup on fail
        await fs.unlink(tempFilePath).catch(() => {});
        console.error('TikTok Automation Error:', automationError);
        return NextResponse.json({ error: automationError.message || 'Error automating TikTok upload' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in TikTok route:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload to TikTok' }, { status: 500 });
  }
}
