import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../api/apiContext';
import { AGENT_STATUS_LABELS, formatDateTime, PHASE_LABELS, PHASE_ORDER } from '../../api/labels';
import { queryKeys } from '../../api/queryKeys';
import { AGENT_STATUSES, type Agent, type AgentStatus } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorMessage } from '../../components/ErrorMessage';
import { SelectField, TextAreaField, TextField } from '../../components/Fields';
import { ArrowLeftIcon } from '../../components/icons';
import { PageHeader } from '../../components/PageHeader';
import { AgentStatusPill, PhaseTag, Pill } from '../../components/Pill';
import shared from '../../components/shared.module.css';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import projectStyles from '../initiatives/InitiativeDetailPage.module.css';
import styles from './AgentsPage.module.css';
import { AgentVersionBadge, RepositoryLink } from './AgentsPage';

function useAgentUpdated(agentId: string) {
  const queryClient = useQueryClient();
  return (agent: Agent) => {
    queryClient.setQueryData(queryKeys.agent(agentId), agent);
    return Promise.all(
      [queryKeys.agents, queryKeys.phases, queryKeys.dashboard].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
  };
}

function StatusForm({ agent }: { agent: Agent }) {
  const api = useApi();
  const onUpdated = useAgentUpdated(agent.id);
  const [status, setStatus] = useState<AgentStatus>(agent.status);
  const change = useMutation({
    mutationFn: () => api.changeAgentStatus(agent.id, { status }),
    onSuccess: onUpdated,
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    change.mutate();
  }

  return (
    <Card as="section" aria-label="Cambiar estado">
      <h2 className={shared.sectionTitle}>Estado</h2>
      <form className={shared.form} onSubmit={handleSubmit}>
        <div className={shared.filters}>
          <SelectField
            label="Nuevo estado"
            value={status}
            onChange={(value) => setStatus(value as AgentStatus)}
            options={AGENT_STATUSES.map((value) => ({ value, label: AGENT_STATUS_LABELS[value] }))}
            hint="Solo un agente En piloto o Activo, con versión vigente, se puede ejecutar."
          />
        </div>
        <ErrorMessage error={change.error} />
        <div className={shared.actions}>
          <Button type="submit" variant="outline" disabled={change.isPending || status === agent.status}>
            {change.isPending ? 'Cambiando…' : 'Cambiar estado'}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function VersionForm({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const api = useApi();
  const onUpdated = useAgentUpdated(agent.id);
  const [version, setVersion] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [instructions, setInstructions] = useState('');
  const [changeNotes, setChangeNotes] = useState('');
  const create = useMutation({
    mutationFn: () =>
      api.addAgentVersion(agent.id, {
        version: version.trim(),
        commitSha: commitSha.trim(),
        instructions,
        changeNotes: changeNotes.trim(),
      }),
    onSuccess: async (updated) => {
      await onUpdated(updated);
      onClose();
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <Card as="section" aria-label="Registrar versión">
      <h3 className={projectStyles.formTitle}>Registrar versión</h3>
      <form className={shared.form} onSubmit={handleSubmit}>
        <div className={shared.formGrid}>
          <TextField label="Versión" required value={version} onChange={setVersion} placeholder="0.2.0" />
          <TextField label="Commit" required value={commitSha} onChange={setCommitSha} hint="SHA del commit en el repositorio." />
        </div>
        <TextAreaField
          label="Instrucciones"
          required
          rows={8}
          value={instructions}
          onChange={setInstructions}
          hint="El texto del agent.md de esta versión."
        />
        <TextAreaField label="Notas del cambio" value={changeNotes} onChange={setChangeNotes} />
        <p className={shared.meta}>La versión nueva pasa a ser la vigente.</p>
        <ErrorMessage error={create.error} />
        <div className={shared.actions}>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Registrando…' : 'Registrar versión'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function AgentDetail({ agent }: { agent: Agent }) {
  const [addingVersion, setAddingVersion] = useState(false);
  const versions = [...agent.versions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader title={agent.name} subtitle={`Fase ${PHASE_ORDER[agent.phaseCode]} · ${PHASE_LABELS[agent.phaseCode]}`} />
      <Card row phase={agent.phaseCode}>
        <AgentVersionBadge agent={agent} />
        <div className={styles.body}>
          <div className={styles.line}>
            <PhaseTag>{PHASE_LABELS[agent.phaseCode]}</PhaseTag>
            <AgentStatusPill status={agent.status} />
          </div>
          {agent.description && <p>{agent.description}</p>}
          <p className={shared.meta}>Responsable: {agent.owner?.fullName ?? 'Sin asignar'}</p>
          <RepositoryLink agent={agent} />
        </div>
      </Card>

      {/* key: el formulario parte del estado actual cada vez que este cambia */}
      <StatusForm key={agent.status} agent={agent} />

      <section className={projectStyles.section} aria-labelledby="versions-title">
        <div className={projectStyles.sectionHead}>
          <h2 className={shared.sectionTitle} id="versions-title">
            Historial de versiones ({versions.length})
          </h2>
          {!addingVersion && <Button onClick={() => setAddingVersion(true)}>Registrar versión</Button>}
        </div>
        {addingVersion && <VersionForm agent={agent} onClose={() => setAddingVersion(false)} />}
        {versions.length === 0 ? (
          !addingVersion && (
            <EmptyState
              title="Este agente aún no tiene versiones"
              text="Registra la primera con el commit y las instrucciones del agente."
              action={<Button onClick={() => setAddingVersion(true)}>Registrar versión</Button>}
            />
          )
        ) : (
          <ul className={shared.stack}>
            {versions.map((item) => (
              <Card as="li" key={item.version} phase={agent.phaseCode}>
                <div className={styles.line}>
                  <h3 className={styles.name}>v{item.version}</h3>
                  {item.version === agent.currentVersion && <Pill tone="accepted">Vigente</Pill>}
                </div>
                <p className={shared.meta}>
                  Commit <span className={styles.sha}>{item.commitSha}</span> · {formatDateTime(item.createdAt)}
                </p>
                {item.changeNotes && <p>{item.changeNotes}</p>}
                {item.instructions && (
                  <details className={styles.instructions}>
                    <summary>Ver instrucciones</summary>
                    <pre>{item.instructions}</pre>
                  </details>
                )}
              </Card>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export function AgentDetailPage() {
  const { agentId = '' } = useParams();
  const api = useApi();
  const agent = useQuery({ queryKey: queryKeys.agent(agentId), queryFn: () => api.getAgent(agentId) });

  return (
    <>
      <Link to="/agents" className={projectStyles.back}>
        <ArrowLeftIcon size={18} />
        Agentes
      </Link>
      {agent.isPending ? (
        <LoadingState label="Cargando el agente…" />
      ) : agent.isError ? (
        <ErrorState error={agent.error} onRetry={() => void agent.refetch()} />
      ) : (
        <AgentDetail agent={agent.data} />
      )}
    </>
  );
}
