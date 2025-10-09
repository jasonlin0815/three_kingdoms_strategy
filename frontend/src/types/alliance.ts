/**
 * Alliance API Types
 *
 * 符合 CLAUDE.md 🟡: snake_case naming matching backend schema
 */

export interface Alliance {
  readonly id: string
  readonly user_id: string
  readonly name: string
  readonly server_name: string | null
  readonly created_at: string
  readonly updated_at: string
}

export interface AllianceCreate {
  readonly name: string
  readonly server_name?: string | null
}

export interface AllianceUpdate {
  readonly name?: string
  readonly server_name?: string | null
}
