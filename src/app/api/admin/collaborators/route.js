import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('collaborators')
      .select('id, email, company_name')
      .order('company_name');

    if (error) {
      console.error('Error fetching collaborators:', error);
      return NextResponse.json({ error: 'Error al obtener colaboradores' }, { status: 500 });
    }

    return NextResponse.json(users || []);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
