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
  actor_user_id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  created_at: string;
  actor: AuditLogActor;
  school: AuditLogSchool | null;
}
