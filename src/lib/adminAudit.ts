import { isMissingSupabaseRpcError, isSupabaseNetworkError, supabase } from './supabase';

export type AdminAuditAction = 'check' | 'insert' | 'update' | 'delete' | 'confirm';

export type AdminAuditPayload = {
  action: AdminAuditAction;
  entityTable: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAdminAuditEvent(payload: AdminAuditPayload) {
  try {
    const { error } = await supabase.rpc('record_admin_audit_event', {
      p_action: payload.action,
      p_entity_table: payload.entityTable,
      p_entity_id: payload.entityId ?? null,
      p_metadata: payload.metadata ?? {},
    });

    if (error) {
      if (isMissingSupabaseRpcError(error) || isSupabaseNetworkError(error)) return null;
      console.warn('Failed to record admin audit event:', error);
      return null;
    }

    return true;
  } catch (error) {
    if (!isSupabaseNetworkError(error)) {
      console.warn('Failed to record admin audit event:', error);
    }
    return null;
  }
}

export async function confirmAdminAuditLog(logId: string) {
  try {
    const { error } = await supabase.rpc('confirm_admin_audit_log', {
      p_log_id: logId,
    });

    if (error) {
      if (isMissingSupabaseRpcError(error) || isSupabaseNetworkError(error)) return false;
      console.warn('Failed to confirm admin audit log:', error);
      return false;
    }

    return true;
  } catch (error) {
    if (!isSupabaseNetworkError(error)) {
      console.warn('Failed to confirm admin audit log:', error);
    }
    return false;
  }
}
