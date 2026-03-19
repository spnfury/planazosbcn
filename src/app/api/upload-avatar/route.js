import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { logActivity } from '@/lib/log';

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
      await logActivity({ action: 'avatar.upload_error', entityType: 'user', details: { error: uploadError.message, filename: file.name }, status: 'error' });
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from('plan-images')
      .getPublicUrl(filePath);

    await logActivity({ action: 'avatar.uploaded', entityType: 'user', details: { filename: file.name, url: data.publicUrl } });

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('Avatar upload API error:', err);
    await logActivity({ action: 'avatar.upload_error', entityType: 'user', details: { error: err.message }, status: 'error' });
    return NextResponse.json({ error: 'Error al subir la foto' }, { status: 500 });
  }
}
