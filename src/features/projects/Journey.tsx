import { formatDateTime, ROLE_LABELS } from '../../api/labels';
import type { PhaseStep } from '../../api/types';
import { Card } from '../../components/Card';
import { PhaseBadge } from '../../components/PhaseBadge';
import { ExecutionStatusPill, ProgressPill } from '../../components/Pill';
import shared from '../../components/shared.module.css';
import styles from './ProjectDetailPage.module.css';

function stepDetail(step: PhaseStep, previous: PhaseStep | undefined): string {
  if (step.lastExecution) {
    const { agent, createdAt } = step.lastExecution;
    return `Generó: ${agent.name} v${agent.version} · ${formatDateTime(createdAt)}`;
  }
  if (step.progress === 'PENDING') {
    return previous ? `Espera el gate de ${previous.name}` : 'Aún no empieza';
  }
  return 'Aún no se ha ejecutado el agente';
}

/** Recorrido vertical por las cinco fases; las no alcanzadas van atenuadas. */
export function Journey({ steps }: { steps: PhaseStep[] }) {
  const ordered = [...steps].sort((a, b) => a.order - b.order);
  return (
    <ol className={shared.stack}>
      {ordered.map((step, index) => {
        const reached = step.progress !== 'PENDING';
        return (
          <Card as="li" row key={step.phaseCode} muted={!reached} phase={step.phaseCode}>
            <PhaseBadge phase={step.phaseCode} size="lg" dimmed={!reached} />
            <div className={shared.main}>
              <h3 className={shared.itemTitle}>{step.name}</h3>
              <p className={reached ? shared.meta : `${shared.meta} ${styles.dimmedText}`}>
                {stepDetail(step, ordered[index - 1])}
              </p>
              {step.lastExecution && (
                <p className={shared.meta}>
                  Última ejecución: <ExecutionStatusPill status={step.lastExecution.status} />
                </p>
              )}
            </div>
            {reached ? (
              <div className={`${styles.gate} ${step.progress === 'AWAITING_GATE' ? styles.gateAwaiting : ''}`}>
                <div className={styles.gateLabel}>Gate · {ROLE_LABELS[step.approverRole]}</div>
                <ProgressPill progress={step.progress} />
              </div>
            ) : (
              <div className={styles.gatePlain}>
                Gate · {ROLE_LABELS[step.approverRole]} · Pendiente
              </div>
            )}
          </Card>
        );
      })}
    </ol>
  );
}
