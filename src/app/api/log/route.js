import { NextResponse } from 'next/server';
import { logActivity } from '@/lib/log';

// Public endpoint for client-side logging (registration, etc.)
// Only allows specific safe actions to prevent abuse
const ALLOWED_ACTIONS = [
  'user.registered',
  'user.register_error',
  'plan.updated',
  'plan.created',
];

export async function POST(request) {
  try {
    const { action, details, status, userEmail } = await request.json();

    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Action not allowed' }, { status: 400 });
    }

    await logActivity({
      action,
      entityType: 'user',
      userEmail: userEmail || null,
      details: details || {},
      status: status || 'success',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Client log error:', err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
