import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../api/apiContext';
import { PHASE_LABELS, PHASE_ORDER } from '../../api/labels';
import { invalidateStructure, queryKeys } from '../../api/queryKeys';
import type { InitiativeSummary } from '../../api/types';
import { Button, ButtonLink } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorMessage } from '../../components/ErrorMessage';
import { TextAreaField, TextField } from '../../components/Fields';
import { ArrowLeftIcon } from '../../components/icons';
import { PageHeader } from '../../components/PageHeader';
import { PhaseBadge } from '../../components/PhaseBadge';
import { PhaseTag } from '../../components/Pill';
import shared from '../../components/shared.module.css';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import styles from './Projects.module.css';

function NewInitiativeForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const create = useMutation({
    mutationFn: () => api.createInitiative(projectId, { name: name.trim(), description: description.trim() }),
    onSuccess: async (initiative) => {
      await invalidateStructure(queryClient);
      navigate(`/initiatives/${initiative.id}`);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  return (
    <Card as="section" aria-label="Nueva iniciativa">
      <h3 className={shared.itemTitle}>Nueva iniciativa</h3>
      <form className={shared.form} onSubmit={handleSubmit}>
        <TextField
          label="Nombre"
          required
          value={name}
          onChange={setName}
          hint="Un lote de trabajo del proyecto; empieza en la fase de Requerimientos."
        />
        <TextAreaField label="Descripción" value={description} onChange={setDescription} />
        <ErrorMessage error={create.error} />
        <div className={shared.actions}>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creando…' : 'Crear iniciativa'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

function InitiativeCard({ initiative }: { initiative: InitiativeSummary }) {
  const to = `/initiatives/${initiative.id}`;
  return (
    <Card as="li" row phase={initiative.currentPhase}>
      <PhaseBadge phase={initiative.currentPhase} />
      <div className={shared.main}>
        <h3 className={shared.itemTitle}>
          <Link to={to}>{initiative.name}</Link>
        </h3>
        <p className={shared.meta}>
          {initiative.storyCount} {initiative.storyCount === 1 ? 'historia' : 'historias'}
        </p>
      </div>
      <PhaseTag>
        Fase {PHASE_ORDER[initiative.currentPhase]} · {PHASE_LABELS[initiative.currentPhase]}
      </PhaseTag>
      <ButtonLink to={to} variant="outline">
        Abrir<span className="visually-hidden"> {initiative.name}</span>
      </ButtonLink>
    </Card>
  );
}

export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const api = useApi();
  const [creating, setCreating] = useState(false);
  const project = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(projectId),
  });

  return (
    <>
      <Link to="/projects" className={styles.back}>
        <ArrowLeftIcon size={18} />
        Proyectos
      </Link>
      {project.isPending ? (
        <LoadingState label="Cargando el proyecto…" />
      ) : project.isError ? (
        <ErrorState error={project.error} onRetry={() => void project.refetch()} />
      ) : (
        <>
          <PageHeader title={project.data.name} subtitle={`Proyecto · Squad ${project.data.squad.name}`} />
          {project.data.description && (
            <Card as="section" aria-label="Descripción">
              <p className={styles.description}>{project.data.description}</p>
            </Card>
          )}
          <section className={styles.section} aria-labelledby="initiatives-title">
            <div className={styles.sectionHead}>
              <h2 className={shared.sectionTitle} id="initiatives-title">
                Iniciativas ({project.data.initiatives.length})
              </h2>
              {!creating && project.data.initiatives.length > 0 && (
                <Button onClick={() => setCreating(true)}>Nueva iniciativa</Button>
              )}
            </div>
            {creating && <NewInitiativeForm projectId={project.data.id} onClose={() => setCreating(false)} />}
            {project.data.initiatives.length === 0 ? (
              !creating && (
                <EmptyState
                  title="Este proyecto aún no tiene iniciativas"
                  text="Una iniciativa es un lote de trabajo: tiene sus historias y recorre las cinco fases por su cuenta."
                  action={<Button onClick={() => setCreating(true)}>Nueva iniciativa</Button>}
                />
              )
            ) : (
              <ul className={shared.stack}>
                {project.data.initiatives.map((initiative) => (
                  <InitiativeCard key={initiative.id} initiative={initiative} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
