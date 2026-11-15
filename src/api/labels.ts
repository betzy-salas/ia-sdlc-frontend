import type {
  AgentStatus,
  Decision,
  ExecutionStatus,
  PhaseCode,
  PhaseProgress,
  SquadRole,
  StoryOrigin,
} from './types';

export const ROLE_LABELS: Record<SquadRole, string> = {
  PRODUCT_OWNER: 'Product Owner',
  TECH_LEAD: 'Líder técnico',
  ARCHITECT: 'Arquitecto',
  DEVELOPER: 'Desarrollador',
  QA: 'QA',
};

export const PHASE_LABELS: Record<PhaseCode, string> = {
  REQUIREMENTS: 'Requerimientos',
  ANALYSIS: 'Análisis',
  DESIGN: 'Diseño',
  CONSTRUCTION: 'Construcción',
  TESTING: 'Pruebas',
};

export const PHASE_ORDER: Record<PhaseCode, number> = {
  REQUIREMENTS: 1,
  ANALYSIS: 2,
  DESIGN: 3,
  CONSTRUCTION: 4,
  TESTING: 5,
};

/** Fase cuyo gate aprueba cada rol (datos semilla del contrato); solo se usa para dar color. */
export const PHASE_BY_ROLE: Record<SquadRole, PhaseCode> = {
  PRODUCT_OWNER: 'REQUIREMENTS',
  TECH_LEAD: 'ANALYSIS',
  ARCHITECT: 'DESIGN',
  DEVELOPER: 'CONSTRUCTION',
  QA: 'TESTING',
};

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  PLANNED: 'Planeado',
  PILOT: 'En piloto',
  ACTIVE: 'Activo',
  RETIRED: 'Retirado',
};

export const EXECUTION_STATUS_LABELS: Record<ExecutionStatus, string> = {
  RUNNING: 'En ejecución',
  PENDING_APPROVAL: 'Por aprobar',
  ACCEPTED: 'Aceptado',
  REWORK_REQUESTED: 'Cambios pedidos',
  REJECTED: 'Rechazado',
  FAILED: 'Falló',
};

export const PROGRESS_LABELS: Record<PhaseProgress, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  AWAITING_GATE: 'Por aprobar',
  APPROVED: 'Aprobado',
};

export const DECISION_LABELS: Record<Decision, string> = {
  APPROVE: 'Aprobó',
  REQUEST_REWORK: 'Pidió cambios',
  REJECT: 'Rechazó',
};

export const ORIGIN_LABELS: Record<StoryOrigin, string> = {
  EXISTING: 'Historia ya escrita',
  ASSISTED: 'Construida con ayuda',
};

const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' });

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : dateFormatter.format(date);
}
