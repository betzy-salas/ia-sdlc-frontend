import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../api/apiContext';
import { AGENT_STATUS_LABELS, PHASE_LABELS, PHASE_ORDER } from '../../api/labels';
import { queryKeys } from '../../api/queryKeys';
import {
  AGENT_STATUSES,
  PHASE_CODES,
  type Agent,
  type AgentFilters,
  type AgentStatus,
  type PhaseCode,
} from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorMessage } from '../../components/ErrorMessage';
import { SelectField, TextAreaField, TextField } from '../../components/Fields';
import { ExternalLinkIcon } from '../../components/icons';
import { PageHeader } from '../../components/PageHeader';
import { PhaseBadge } from '../../components/PhaseBadge';
import { AgentStatusPill } from '../../components/Pill';
import shared from '../../components/shared.module.css';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import styles from './AgentsPage.module.css';

const PHASE_OPTIONS = PHASE_CODES.map((code) => ({
  value: code,
  label: `${PHASE_ORDER[code]} · ${PHASE_LABELS[code]}`,
}));

/** Cuadro con la versión vigente sobre el color de la fase del agente. */
export function AgentVersionBadge({ agent }: { agent: Pick<Agent, 'phaseCode' | 'currentVersion'> }) {
  return (
    <PhaseBadge phase={agent.phaseCode} size="xl" dimmed={agent.currentVersion === null}>
      {agent.currentVersion !== null ? (
        <>
          <span className="visually-hidden">Versión vigente </span>v{agent.currentVersion}
        </>
      ) : (
        <span className={styles.versionEmpty}>Sin versión</span>
      )}
    </PhaseBadge>
  );
}

export function RepositoryLink({ agent }: { agent: Pick<Agent, 'repositoryUrl' | 'repositoryPath'> }) {
  return (
    <a className={shared.link} href={agent.repositoryUrl} target="_blank" rel="noreferrer">
      <ExternalLinkIcon size={18} />
      Repositorio{agent.repositoryPath ? ` · ${agent.repositoryPath}` : ''}
      <span className="visually-hidden"> (se abre en otra pestaña)</span>
    </a>
  );
}

function RegisterAgentForm({ onClose }: { onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const users = useQuery({ queryKey: queryKeys.users, queryFn: () => api.listUsers() });
  const [name, setName] = useState('');
  const [phaseCode, setPhaseCode] = useState<PhaseCode>('REQUIREMENTS');
  const [description, setDescription] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [repositoryPath, setRepositoryPath] = useState('');
  const [ownerUserId, setOwnerUserId] = useState('');

  const create = useMutation({
    mutationFn: () =>
      api.createAgent({
        name: name.trim(),
        phaseCode,
        description: description.trim(),
        repositoryUrl: repositoryUrl.trim(),
        repositoryPath: repositoryPath.trim(),
        ownerUserId,
      }),
    onSuccess: async (agent) => {
      await Promise.all(
        [queryKeys.agents, queryKeys.phases, queryKeys.dashboard].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
      navigate(`/agents/${agent.id}`);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <Card as="section" aria-label="Registrar agente">
      <h2 className={shared.sectionTitle}>Registrar agente</h2>
      <form className={shared.form} onSubmit={handleSubmit}>
        <div className={shared.formGrid}>
          <TextField label="Nombre" required value={name} onChange={setName} />
          <SelectField
            label="Fase"
            required
            value={phaseCode}
            onChange={(value) => setPhaseCode(value as PhaseCode)}
            options={PHASE_OPTIONS}
          />
        </div>
        <TextAreaField label="Descripción" value={description} onChange={setDescription} />
        <div className={shared.formGrid}>
          <TextField
            label="URL del repositorio"
            type="url"
            required
            value={repositoryUrl}
            onChange={setRepositoryUrl}
            placeholder="https://…"
          />
          <TextField
            label="Carpeta"
            value={repositoryPath}
            onChange={setRepositoryPath}
            hint="Carpeta del agente dentro del repositorio."
          />
          <SelectField
            label="Responsable"
            required
            value={ownerUserId}
            onChange={setOwnerUserId}
            placeholder={users.isPending ? 'Cargando personas…' : 'Elige una persona'}
            options={(users.data ?? []).map((user) => ({ value: user.id, label: user.fullName }))}
          />
        </div>
        <p className={shared.meta}>El agente queda Planeado y sin versión hasta que registres la primera.</p>
        <ErrorMessage error={users.error ?? create.error} />
        <div className={shared.actions}>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Registrando…' : 'Registrar agente'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function AgentsPage() {
  const api = useApi();
  const [registering, setRegistering] = useState(false);
  const [phase, setPhase] = useState<PhaseCode | ''>('');
  const [status, setStatus] = useState<AgentStatus | ''>('');
  const filters: AgentFilters = { ...(phase ? { phase } : {}), ...(status ? { status } : {}) };
  const filtered = Boolean(phase || status);
  const agents = useQuery({ queryKey: queryKeys.agentList(filters), queryFn: () => api.listAgents(filters) });

  return (
    <>
      <PageHeader
        title="Agentes"
        subtitle="El catálogo de agentes, con la versión vigente de cada uno."
        actions={!registering && <Button onClick={() => setRegistering(true)}>Registrar agente</Button>}
      />
      {registering && <RegisterAgentForm onClose={() => setRegistering(false)} />}
      <div className={shared.filters}>
        <SelectField
          label="Fase"
          value={phase}
          onChange={(value) => setPhase(value as PhaseCode | '')}
          placeholder="Todas"
          options={PHASE_OPTIONS}
        />
        <SelectField
          label="Estado"
          value={status}
          onChange={(value) => setStatus(value as AgentStatus | '')}
          placeholder="Todos"
          options={AGENT_STATUSES.map((value) => ({ value, label: AGENT_STATUS_LABELS[value] }))}
        />
      </div>
      {agents.isPending ? (
        <LoadingState label="Cargando agentes…" />
      ) : agents.isError ? (
        <ErrorState error={agents.error} onRetry={() => void agents.refetch()} />
      ) : agents.data.length === 0 ? (
        filtered ? (
          <EmptyState
            title="Ningún agente coincide con el filtro"
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setPhase('');
                  setStatus('');
                }}
              >
                Quitar filtros
              </Button>
            }
          />
        ) : (
          !registering && (
            <EmptyState
              title="Aún no hay agentes registrados"
              text="Registra el primero con su repositorio y su responsable."
              action={<Button onClick={() => setRegistering(true)}>Registrar agente</Button>}
            />
          )
        )
      ) : (
        <ul className={shared.stack}>
          {agents.data.map((agent) => (
            <Card as="li" row key={agent.id} phase={agent.phaseCode}>
              <AgentVersionBadge agent={agent} />
              <div className={styles.body}>
                <h2 className={styles.name}>
                  <Link to={`/agents/${agent.id}`}>{agent.name}</Link>
                </h2>
                <div className={styles.line}>
                  Fase {PHASE_ORDER[agent.phaseCode]} · {PHASE_LABELS[agent.phaseCode]}
                  <AgentStatusPill status={agent.status} />
                </div>
                {agent.description && <p>{agent.description}</p>}
                <p className={shared.meta}>Responsable: {agent.owner?.fullName ?? 'Sin asignar'}</p>
                <RepositoryLink agent={agent} />
              </div>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
