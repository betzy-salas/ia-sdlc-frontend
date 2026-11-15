import type { ReactNode } from 'react';
import { PHASE_LABELS, PHASE_ORDER } from '../api/labels';
import type { PhaseCode } from '../api/types';
import styles from './PhaseBadge.module.css';

interface PhaseBadgeProps {
  phase: PhaseCode;
  size?: 'md' | 'lg' | 'xl';
  dimmed?: boolean;
  /** Contenido alterno (por ejemplo la versión de un agente). Por defecto, el número de la fase. */
  children?: ReactNode;
}

/** Cuadro con el color fuerte de la fase y su número. */
export function PhaseBadge({ phase, size = 'md', dimmed = false, children }: PhaseBadgeProps) {
  return (
    <div className={`${styles.badge} ${styles[size]} ${dimmed ? styles.dimmed : ''}`} data-phase={phase}>
      {children ?? (
        <>
          <span className="visually-hidden">Fase </span>
          {PHASE_ORDER[phase]}
          <span className="visually-hidden"> · {PHASE_LABELS[phase]}</span>
        </>
      )}
    </div>
  );
}
