import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../api/apiContext';
import { AGENT_STATUS_LABELS, ROLE_LABELS } from '../../api/labels';
import { queryKeys } from '../../api/queryKeys';
import { ButtonLink } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';
import { PhaseTag } from '../../components/Pill';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import styles from './HomePage.module.css';

export function HomePage() {
  const api = useApi();
  const phases = useQuery({ queryKey: queryKeys.dashboard, queryFn: () => api.getDashboardPhases() });

  return (
    <>
      <PageHeader
        title="De la necesidad al código probado"
        subtitle="En cada fase un agente propone y una persona aprueba."
      />
      {phases.isPending ? (
        <LoadingState label="Cargando las fases…" />
      ) : phases.isError ? (
        <ErrorState error={phases.error} onRetry={() => void phases.refetch()} />
      ) : phases.data.length === 0 ? (
        <EmptyState
          title="Aún no hay fases configuradas"
          text="Cuando el backend tenga las fases del proceso, aparecerán aquí."
          action={<ButtonLink to="/projects">Ir a proyectos</ButtonLink>}
        />
      ) : (
        <ul className={styles.grid}>
          {[...phases.data]
            .sort((a, b) => a.order - b.order)
            .map((phase) => (
              <li key={phase.phaseCode} className={styles.card} data-phase={phase.phaseCode}>
                <div className={styles.head}>
                  <div className={styles.number} aria-hidden="true">
                    {phase.order}
                  </div>
                  <h2 className={styles.name}>
                    <span className="visually-hidden">Fase {phase.order}: </span>
                    {phase.name}
                  </h2>
                </div>
                <div className={styles.body}>
                  {phase.agents.length > 0 ? (
                    <ul className={styles.agents} aria-label="Agentes">
                      {phase.agents.map((agent) => (
                        <li key={agent.id}>
                          <PhaseTag>
                            {agent.name} · {AGENT_STATUS_LABELS[agent.status]}
                          </PhaseTag>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.noAgents}>Sin agentes registrados</p>
                  )}
                  <p className={styles.approver}>Aprueba: {ROLE_LABELS[phase.approverRole]}</p>
                  <dl className={styles.counts}>
                    <div className={styles.count}>
                      <dt>{phase.projectsInPhase === 1 ? 'proyecto' : 'proyectos'}</dt>
                      <dd>{phase.projectsInPhase}</dd>
                    </div>
                    <div className={styles.count}>
                      <dt>por aprobar</dt>
                      <dd>{phase.pendingApprovals}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
        </ul>
      )}
    </>
  );
}
