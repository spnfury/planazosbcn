import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name?.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `avatars/${filename}`;

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to plan-images bucket (avatars subfolder) using service role
    const { error: uploadError } = await supabaseAdmin.storage
      .from('plan-images')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from('plan-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('Avatar upload API error:', err);
    return NextResponse.json({ error: 'Error al subir la foto' }, { status: 500 });
  }
}
