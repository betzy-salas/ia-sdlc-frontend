import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../api/apiContext';
import { EXECUTION_STATUS_LABELS, formatDateTime, PHASE_LABELS } from '../../api/labels';
import { queryKeys } from '../../api/queryKeys';
import { EXECUTION_STATUSES, type ExecutionFilters, type ExecutionStatus } from '../../api/types';
import { Button, ButtonLink } from '../../components/Button';
import { Card } from '../../components/Card';
import { SelectField } from '../../components/Fields';
import { PageHeader } from '../../components/PageHeader';
import { PhaseBadge } from '../../components/PhaseBadge';
import { ExecutionStatusPill } from '../../components/Pill';
import shared from '../../components/shared.module.css';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';

export function ExecutionsPage() {
  const api = useApi();
  const [status, setStatus] = useState<ExecutionStatus | ''>('');
  const filters: ExecutionFilters = status ? { status } : {};
  const executions = useQuery({
    queryKey: queryKeys.executionList(filters),
    queryFn: () => api.listExecutions(filters),
  });

  return (
    <>
      <PageHeader title="Ejecuciones" subtitle="Qué generó cada agente y qué decidió la persona que revisó." />
      <div className={shared.filters}>
        <SelectField
          label="Estado"
          value={status}
          onChange={(value) => setStatus(value as ExecutionStatus | '')}
          placeholder="Todos"
          options={EXECUTION_STATUSES.map((value) => ({ value, label: EXECUTION_STATUS_LABELS[value] }))}
        />
      </div>
      {executions.isPending ? (
        <LoadingState label="Cargando ejecuciones…" />
      ) : executions.isError ? (
        <ErrorState error={executions.error} onRetry={() => void executions.refetch()} />
      ) : executions.data.length === 0 ? (
        status ? (
          <EmptyState
            title="No hay ejecuciones con ese estado"
            action={
              <Button variant="outline" onClick={() => setStatus('')}>
                Ver todas
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="Aún no hay ejecuciones"
            text="Abre un proyecto con historias y usa «Refinar con el agente»."
            action={<ButtonLink to="/projects">Ir a proyectos</ButtonLink>}
          />
        )
      ) : (
        <ul className={shared.stack}>
          {executions.data.map((execution) => (
            <Card as="li" row key={execution.id} phase={execution.phaseCode}>
              <PhaseBadge phase={execution.phaseCode} />
              <div className={shared.main}>
                <h2 className={shared.itemTitle}>
                  <Link to={`/projects/${execution.project.id}`}>{execution.project.name}</Link> ·{' '}
                  {PHASE_LABELS[execution.phaseCode]}
                </h2>
                <p className={shared.meta}>
                  {execution.agent.name} v{execution.agent.version} · Lanzó: {execution.launchedBy.fullName} ·{' '}
                  {formatDateTime(execution.createdAt)}
                </p>
              </div>
              <ExecutionStatusPill status={execution.status} />
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
