import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// Reusable function to verify admin token
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

  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single();

  return adminUser ? user : null;
}

export async function GET(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'pendiente' | 'completada'
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('pending_tasks')
      .select('*, auth_users:created_by ( email )')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,client_name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: tasks, error } = await query;
    if (error) throw error;

    return NextResponse.json({ tasks: tasks || [] });
  } catch (err) {
    console.error('API /api/admin/tareas GET error:', err);
    return NextResponse.json({ error: 'Error al cargar tareas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, client_name, priority } = body;

    if (!title) {
      return NextResponse.json({ error: 'El título es obligatorio' }, { status: 400 });
    }

    const { data: task, error } = await supabaseAdmin
      .from('pending_tasks')
      .insert({
        title,
        description: description || null,
        client_name: client_name || null,
        priority: priority || 'normal',
        status: 'pendiente',
        created_by: admin.id
      })
      .select()
      .single();

    if (error) throw error;

    // Log action
    await supabaseAdmin.from('activity_logs').insert({
      action: 'task.created',
      entity_type: 'task',
      entity_id: task.id,
      user_id: admin.id,
      user_email: admin.email,
      status: 'success',
      details: { title, client: client_name }
    });

    return NextResponse.json({ success: true, task });
  } catch (err) {
    console.error('API /api/admin/tareas POST error:', err);
    return NextResponse.json({ error: 'Error al crear tarea' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, title, description, client_name, priority } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de tarea obligatorio' }, { status: 400 });
    }

    const updates = {};
    if (status !== undefined) {
      updates.status = status;
      if (status === 'completada') {
        updates.completed_at = new Date().toISOString();
      } else if (status === 'pendiente') {
        updates.completed_at = null;
      }
    }
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (client_name !== undefined) updates.client_name = client_name;
    if (priority !== undefined) updates.priority = priority;

    const { data: task, error } = await supabaseAdmin
      .from('pending_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, task });
  } catch (err) {
    console.error('API /api/admin/tareas PATCH error:', err);
    return NextResponse.json({ error: 'Error al actualizar tarea' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de tarea obligatorio' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('pending_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Log action
    await supabaseAdmin.from('activity_logs').insert({
      action: 'task.deleted',
      entity_type: 'task',
      entity_id: id,
      user_id: admin.id,
      user_email: admin.email,
      status: 'success'
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API /api/admin/tareas DELETE error:', err);
    return NextResponse.json({ error: 'Error al eliminar tarea' }, { status: 500 });
  }
}
