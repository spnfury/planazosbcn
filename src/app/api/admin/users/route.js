import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Use Supabase Admin API to list auth users
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to safe fields only
    const users = (data?.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name || '',
      avatar_url: u.user_metadata?.avatar_url || '',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      email_confirmed_at: u.email_confirmed_at,
    }));

    return NextResponse.json(users);
  } catch (err) {
    console.error('Users API error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
