import { NextResponse } from 'next/server';
import { IgApiClient } from 'instagram-private-api';
// We might need to fetch the video as a buffer from the URL

export async function POST(req) {
  try {
    const { videoUrl, caption, coverUrl } = await req.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
    }

    const sessionIdCookie = process.env.IG_SESSIONID;
    if (!sessionIdCookie) {
      return NextResponse.json({ error: 'IG_SESSIONID environment variable is missing' }, { status: 400 });
    }

    // Initialize IG Client
    const ig = new IgApiClient();
    
    // We must generate a "device" so instagram doesn't block the request immediately.
    // The device string name can be inferred from user id embedded in the cookie, or just a fixed random string.
    const splitCookie = sessionIdCookie.split(':');
    const userId = splitCookie[0];
    
    ig.state.generateDevice(userId); // Generate consistent device based on userId
    
    // Create the fake state to inject the sessionID
    const fakeState = {
      constants: {},
      cookies: JSON.stringify({
        "i.instagram.com": {
          "/": {
            "sessionid": {
              "key": "sessionid",
              "value": sessionIdCookie,
              "domain": "i.instagram.com",
              "path": "/",
              "hostOnly": false,
              "creation": new Date().toISOString(),
              "lastAccessed": new Date().toISOString()
            }
          }
        }
      })
    };

    // Import the fake cookie jar
    await ig.state.deserializeCookieJar(fakeState.cookies);
    // You also need to manually set the ds_user_id (which is embedded in the sessionid)
    ig.state.extractCookieUserId = () => userId;
    
    // Fetch the video file as buffer
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
        throw new Error("Failed to download video from URL");
    }
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    // Fetch the cover image as buffer if provided, otherwise you might need a placeholder or first frame.
    let coverBuffer;
    if (coverUrl) {
       const coverResponse = await fetch(coverUrl);
       if (coverResponse.ok) {
          coverBuffer = Buffer.from(await coverResponse.arrayBuffer());
       }
    }
    
    // If no cover is supplied, IG often requires one. Provide a 1x1 black JPEG as fallback
    if (!coverBuffer) {
        // Minimum valid JPEG format bytes (approximate blank JPEG)
        coverBuffer = Buffer.from([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 
            0xFF, 0xDB, 0x00, 0x43, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 
            0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 
            0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
            0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x3F, 0xFF, 0xD9
        ]);
    }

    // Publish Reel
    const publishResult = await ig.publish.video({
        video: videoBuffer,
        coverImage: coverBuffer,
        caption: caption || '',
    });

    return NextResponse.json({ success: true, result: publishResult });

  } catch (error) {
    console.error('Error publishing to Instagram:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload to Instagram' }, { status: 500 });
  }
}
