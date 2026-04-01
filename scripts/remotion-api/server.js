require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { bundle } = require('@remotion/bundler');
const { getCompositions, renderMedia } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5050;

// Initialize Supabase Admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("WARN: Supabase credentials are not fully set in .env!");
}

const supabaseAdmin = createClient(supabaseUrl || '', supabaseKey || '');

app.post('/api/render', async (req, res) => {
  try {
    const props = req.body;
    console.log('Received render request:', props);

    const webpackOverride = (config) => config;

    // Entry point relative to this server.js file
    const entryPath = path.resolve(__dirname, 'src/remotion/index.js');
    console.log('Bundling Remotion project at:', entryPath);
    
    if (!fs.existsSync(entryPath)) {
      throw new Error(`Entry point not found at ${entryPath}`);
    }

    // Bundle the remotion project
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

    // Prepare temp dir
    const outputDir = path.join(__dirname, 'tmp');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFilename = `reel-${uuidv4()}.mp4`;
    const outputPath = path.join(outputDir, outputFilename);

    console.log('Rendering media to:', outputPath);
    
    // Perform exact render
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

    // Cleanup temp file
    fs.promises.unlink(outputPath).catch(err => console.error('Failed to clear tmp local file:', err));

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('docs')
      .getPublicUrl(`reels/${outputFilename}`);

    console.log('Successfully generated Reel at URL:', publicUrl);
    
    return res.status(200).json({ success: true, url: publicUrl });

  } catch (error) {
    console.error('Render API error:', error);
    return res.status(500).json({ error: error.message || 'Error rendering video' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Remotion Rendering Farm running on port ${PORT}`);
});
