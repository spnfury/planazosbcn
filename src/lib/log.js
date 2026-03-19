import { supabaseAdmin } from '@/lib/supabase-server';

/**
 * Log an activity to the activity_logs table.
 *
 * @param {Object} opts
 * @param {string} opts.action       - e.g. 'plan.updated', 'user.registered', 'avatar.uploaded'
 * @param {string} [opts.entityType] - e.g. 'plan', 'user', 'reservation', 'review'
 * @param {string} [opts.entityId]   - ID of the affected entity
 * @param {string} [opts.userId]     - UUID of the user performing the action
 * @param {string} [opts.userEmail]  - Email for quick lookup without join
 * @param {Object} [opts.details]    - Flexible JSON data (changed fields, errors, filenames, etc.)
 * @param {string} [opts.status]     - 'success' (default) or 'error'
 * @param {string} [opts.ipAddress]  - Client IP address
 */
export async function logActivity({
  action,
  entityType = null,
  entityId = null,
  userId = null,
  userEmail = null,
  details = {},
  status = 'success',
  ipAddress = null,
}) {
  try {
    await supabaseAdmin.from('activity_logs').insert({
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      user_id: userId,
      user_email: userEmail,
      details,
      status,
      ip_address: ipAddress,
    });
  } catch (err) {
    // Never let logging break the main flow
    console.error('[logActivity] Failed to write log:', err);
  }
}

/**
 * Helper to get a diff of changed fields between old and new objects.
 * Returns an object like: { fieldName: { old: 'X', new: 'Y' } }
 */
export function getChanges(oldObj, newObj, fieldsToTrack) {
  const changes = {};
  for (const field of fieldsToTrack) {
    const oldVal = oldObj[field];
    const newVal = newObj[field];
    if (String(oldVal ?? '') !== String(newVal ?? '')) {
      changes[field] = { old: oldVal ?? null, new: newVal ?? null };
    }
  }
  return Object.keys(changes).length > 0 ? changes : null;
}
