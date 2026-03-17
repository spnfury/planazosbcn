// Setup Supabase Storage bucket for plan images
// Run: node setup-storage.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setup() {
  console.log('Creating plan-images bucket...');

  const { data, error } = await supabase.storage.createBucket('plan-images', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  });

  if (error) {
    if (error.message?.includes('already exists')) {
      console.log('✓ Bucket "plan-images" already exists');
    } else {
      console.error('Error:', error.message);
    }
  } else {
    console.log('✓ Bucket "plan-images" created successfully');
  }
}

setup();
