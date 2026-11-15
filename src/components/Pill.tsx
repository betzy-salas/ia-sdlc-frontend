import type { ReactNode } from 'react';
import {
  AGENT_STATUS_LABELS,
  EXECUTION_STATUS_LABELS,
  PROGRESS_LABELS,
} from '../api/labels';
import type { AgentStatus, ExecutionStatus, PhaseCode, PhaseProgress } from '../api/types';
import styles from './Pill.module.css';

export type PillTone = 'accepted' | 'pending' | 'neutral' | 'dark' | 'danger';

/** Etiqueta de estado. El estado siempre va escrito: el color solo acompaña. */
export function Pill({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) {
  return <span className={`${styles.pill} ${styles[tone]}`}>{children}</span>;
}

/** Etiqueta con el color suave de una fase (por ejemplo, el nombre de un agente). */
export function PhaseTag({ phase, children }: { phase?: PhaseCode; children: ReactNode }) {
  return (
    <span className={styles.tag} data-phase={phase}>
      {children}
    </span>
  );
}

const EXECUTION_TONES: Record<ExecutionStatus, PillTone> = {
  RUNNING: 'neutral',
  PENDING_APPROVAL: 'pending',
  ACCEPTED: 'accepted',
  REWORK_REQUESTED: 'neutral',
  REJECTED: 'danger',
  FAILED: 'danger',
};

export function ExecutionStatusPill({ status }: { status: ExecutionStatus }) {
  return <Pill tone={EXECUTION_TONES[status]}>{EXECUTION_STATUS_LABELS[status]}</Pill>;
}

const AGENT_TONES: Record<AgentStatus, PillTone> = {
  PLANNED: 'neutral',
  PILOT: 'dark',
  ACTIVE: 'accepted',
  RETIRED: 'neutral',
};

export function AgentStatusPill({ status }: { status: AgentStatus }) {
  return <Pill tone={AGENT_TONES[status]}>{AGENT_STATUS_LABELS[status]}</Pill>;
}

const PROGRESS_TONES: Record<PhaseProgress, PillTone> = {
  PENDING: 'neutral',
  IN_PROGRESS: 'dark',
  AWAITING_GATE: 'pending',
  APPROVED: 'accepted',
};

export function ProgressPill({ progress }: { progress: PhaseProgress }) {
  return <Pill tone={PROGRESS_TONES[progress]}>{PROGRESS_LABELS[progress]}</Pill>;
}
