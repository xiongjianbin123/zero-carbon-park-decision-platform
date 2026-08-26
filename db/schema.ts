export const WORKSPACE_SCHEMA_VERSION = 1 as const

export const ORG_ROLES = ['org_admin', 'org_member'] as const
export type OrgRole = (typeof ORG_ROLES)[number]

export const PARK_ROLES = ['admin', 'manager', 'specialist', 'viewer'] as const
export type ParkRole = (typeof PARK_ROLES)[number]

export const TASK_STATUSES = ['draft', 'open', 'in_progress', 'blocked', 'done'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const INDICATOR_STATUSES = ['achieved', 'gap', 'missing_data', 'not_applicable'] as const
export type IndicatorStatus = (typeof INDICATOR_STATUSES)[number]

export const WORKSPACE_TABLES = [
  'workspace_users',
  'parks',
  'park_members',
  'imports',
  'energy_monthly',
  'load_curve_points',
  'enterprises',
  'park_projects',
  'indicator_results',
  'tasks',
  'files',
  'exports',
  'audit_logs',
] as const

