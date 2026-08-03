export interface AuditLogActor {
  id: number;
  name: string;
  email: string;
}

export interface AuditLogSchool {
  id: number;
  name: string;
}

export interface AuditLogEntry {
  id: number;
  school_id: number | null;
  actor_user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
  // Null when the action was triggered outside an authenticated request
  // (e.g. a secret-protected /api/tasks/* action) — AuditLogger::log()
  // always resolves actor_user_id from Auth::id(), which is null there.
  actor: AuditLogActor | null;
  school: AuditLogSchool | null;
}
