import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/log';

// Verify the request comes from an authenticated admin
async function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabaseUser.auth.getUser();
  if (error || !user) return null;

  // Check admin_users table
  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single();

  return adminUser ? user : null;
}

export async function POST(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name?.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `plans/${filename}`;

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload using service role (bypasses RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('plan-images')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      await logActivity({ action: 'plan.image_upload_error', entityType: 'plan', userId: admin.id, userEmail: admin.email, details: { error: uploadError.message, filename: file.name }, status: 'error' });
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from('plan-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('Upload API error:', err);
    await logActivity({ action: 'plan.image_upload_error', entityType: 'plan', details: { error: err.message }, status: 'error' });
    return NextResponse.json({ error: 'Error al subir imagen' }, { status: 500 });
  }
}
