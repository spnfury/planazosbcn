import { NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { getCompositions, renderMedia } from '@remotion/renderer';
import path from 'path';
import os from 'os';
import { supabaseAdmin } from '@/lib/supabase-server';
import fs from 'fs';

export async function POST(req) {
  try {
    const props = await req.json();

    const webpackOverride = (config) => {
      return config;
    };

    const entryPath = path.resolve(process.cwd(), 'src/remotion/index.js');
    console.log('Bundling Remotion project at:', entryPath);
    
    if (!fs.existsSync(entryPath)) {
      throw new Error(`Entry point not found at ${entryPath}`);
    }

    // Use Remotion bundler to pack the code
    const bundleLocation = await bundle({
      entryPoint: entryPath,
      webpackOverride,
    });

    const compositionId = 'PlanazoReel';

    console.log('Fetching compositions from bundle:', bundleLocation);
    const comps = await getCompositions(bundleLocation, {
      inputProps: props,
    });
    
    const composition = comps.find((c) => c.id === compositionId);
    if (!composition) {
      throw new Error(`No composition found with ID ${compositionId}`);
    }

    const outputDir = path.join(process.cwd(), 'public', 'tmp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFilename = `reel-${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    console.log('Rendering media to:', outputPath);
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: props,
    });

    console.log('Render complete! Uploading to Supabase...');
    const buffer = fs.readFileSync(outputPath);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('docs')
      .upload(`reels/${outputFilename}`, buffer, {
        contentType: 'video/mp4',
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw uploadError;
    }

    // Delete temp file asynchronously
    fs.promises.unlink(outputPath).catch(err => console.error('Failed to rm local temp mp4:', err));

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('docs')
      .getPublicUrl(`reels/${outputFilename}`);

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (error) {
    console.error('Render API error:', error);
    return NextResponse.json({ error: error.message || 'Error rendering video' }, { status: 500 });
  }
}
