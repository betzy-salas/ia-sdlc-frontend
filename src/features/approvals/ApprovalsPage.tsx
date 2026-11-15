import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useApi } from '../../api/apiContext';
import { formatDateTime, PHASE_LABELS } from '../../api/labels';
import { invalidateWorkflow, queryKeys } from '../../api/queryKeys';
import type { Decision, Execution } from '../../api/types';
import { ButtonLink } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { PhaseBadge } from '../../components/PhaseBadge';
import { ExecutionStatusPill } from '../../components/Pill';
import { RefinedStoryView } from '../../components/RefinedStoryView';
import shared from '../../components/shared.module.css';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import styles from './ApprovalsPage.module.css';
import { DecisionForm } from './DecisionForm';

function ApprovalCard({ execution }: { execution: Execution }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const decide = useMutation({
    mutationFn: ({ decision, comment }: { decision: Decision; comment: string }) =>
      api.decide(execution.id, { decision, comment: comment || null }),
    // Si falla (por ejemplo NOT_GATE_APPROVER), la tarjeta se queda para mostrar el error del back.
    onSuccess: () => invalidateWorkflow(queryClient),
  });

  return (
    <Card as="li" phase={execution.phaseCode}>
      <div className={styles.head}>
        <PhaseBadge phase={execution.phaseCode} size="lg" />
        <div className={shared.main}>
          <h2 className={shared.itemTitle}>
            <Link to={`/projects/${execution.project.id}`}>{execution.project.name}</Link> · Historias refinadas
          </h2>
          <p className={shared.meta}>
            {PHASE_LABELS[execution.phaseCode]} · Generó: {execution.agent.name} v{execution.agent.version} ·
            Lanzó: {execution.launchedBy.fullName} · {formatDateTime(execution.createdAt)}
          </p>
        </div>
        <ExecutionStatusPill status={execution.status} />
      </div>
      {execution.refinedStories.length > 0 ? (
        <ul className={styles.stories}>
          {execution.refinedStories.map((item) => (
            <li key={item.storyId} className={styles.story}>
              <p className={styles.original}>Historia original: {item.originalTitle}</p>
              <RefinedStoryView refined={item.refined} />
            </li>
          ))}
        </ul>
      ) : (
        <p className={shared.meta}>Esta ejecución no trae historias refinadas.</p>
      )}
      <DecisionForm
        pending={decide.isPending}
        error={decide.error}
        onDecide={(decision, comment) => decide.mutate({ decision, comment })}
      />
    </Card>
  );
}

export function ApprovalsPage() {
  const api = useApi();
  const pending = useQuery({ queryKey: queryKeys.approvals, queryFn: () => api.listPendingApprovals() });

  return (
    <>
      <PageHeader title="Por aprobar" subtitle="Lo que espera tu revisión para avanzar de fase." />
      {pending.isPending ? (
        <LoadingState label="Buscando lo que espera tu revisión…" />
      ) : pending.isError ? (
        <ErrorState error={pending.error} onRetry={() => void pending.refetch()} />
      ) : pending.data.length === 0 ? (
        <EmptyState
          title="No tienes nada por aprobar"
          text="Aquí aparece lo que proponen los agentes en los proyectos de tus squads, según tu rol."
          action={<ButtonLink to="/projects">Ir a proyectos</ButtonLink>}
        />
      ) : (
        <ul className={shared.stack}>
          {pending.data.map((execution) => (
            <ApprovalCard key={execution.id} execution={execution} />
          ))}
        </ul>
      )}
    </>
  );
}
