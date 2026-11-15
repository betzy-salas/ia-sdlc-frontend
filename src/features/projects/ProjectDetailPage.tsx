import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../api/apiContext';
import {
  DECISION_LABELS,
  formatDateTime,
  ORIGIN_LABELS,
  PHASE_LABELS,
  PHASE_ORDER,
  ROLE_LABELS,
} from '../../api/labels';
import { invalidateWorkflow, queryKeys } from '../../api/queryKeys';
import type { CreateStoryRequest, PhaseStep, Project, Story } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorMessage } from '../../components/ErrorMessage';
import { ArrowLeftIcon, CheckIcon, ClockIcon, SparkIcon, TrashIcon } from '../../components/icons';
import { PageHeader } from '../../components/PageHeader';
import { Pill } from '../../components/Pill';
import { RefinedStoryView } from '../../components/RefinedStoryView';
import shared from '../../components/shared.module.css';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { Journey } from './Journey';
import styles from './ProjectDetailPage.module.css';
import { AssistedStoryForm, ExistingStoryForm } from './StoryForms';

type StoryFormMode = 'existing' | 'assisted' | null;

/** Comentario de la última decisión (pedir cambios o rechazar) para saber qué corregir. */
function LastDecisionNote({ step }: { step: PhaseStep }) {
  const api = useApi();
  const last = step.lastExecution;
  const decided = last !== null && (last.status === 'REWORK_REQUESTED' || last.status === 'REJECTED');
  const execution = useQuery({
    queryKey: queryKeys.execution(last?.id ?? ''),
    queryFn: () => api.getExecution(last?.id ?? ''),
    enabled: decided,
  });
  const decision = execution.data?.decision;
  if (!decided || !decision) return null;
  return (
    <div className={`${styles.banner} ${styles.bannerNote}`}>
      <span>
        <strong>
          {decision.decidedBy.fullName} {DECISION_LABELS[decision.decision].toLowerCase()}
        </strong>{' '}
        el {formatDateTime(decision.decidedAt)}.
      </span>
      {decision.comment && <span>Comentario: {decision.comment}</span>}
    </div>
  );
}

function StoryCard({
  story,
  canDelete,
  onDelete,
  deleting,
}: {
  story: Story;
  canDelete: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card as="li" phase="REQUIREMENTS">
      <div className={styles.storyHead}>
        <div className={shared.main}>
          <h3 className={styles.storyTitle}>{story.title}</h3>
          <p className={shared.meta}>{ORIGIN_LABELS[story.origin]}</p>
        </div>
        {canDelete && (
          <Button
            variant="danger"
            iconOnly
            aria-label={`Quitar la historia ${story.title}`}
            disabled={deleting}
            onClick={onDelete}
          >
            <TrashIcon />
          </Button>
        )}
      </div>
      <div className={styles.columns}>
        <div className={`${styles.column} ${styles.original}`}>
          <h4 className={styles.columnLabel}>Original</h4>
          <p className={styles.description}>{story.description}</p>
        </div>
        <div className={`${styles.column} ${styles.refined}`}>
          <h4 className={styles.columnLabel}>Refinada por el agente</h4>
          {story.refined ? (
            <RefinedStoryView refined={story.refined} />
          ) : (
            <p className={shared.meta}>Aún sin refinar.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

function StoriesSection({ project }: { project: Project }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<StoryFormMode>(null);

  const requirements = project.journey.find((step) => step.phaseCode === 'REQUIREMENTS');
  const progress = requirements?.progress;
  const editable = progress === 'IN_PROGRESS';
  const approver = requirements ? ROLE_LABELS[requirements.approverRole] : ROLE_LABELS.PRODUCT_OWNER;

  const refreshProject = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);

  const addStory = useMutation({
    mutationFn: (story: CreateStoryRequest) => api.addStory(project.id, story),
    onSuccess: async () => {
      await refreshProject();
      setFormMode(null);
    },
  });

  const deleteStory = useMutation({
    mutationFn: (storyId: string) => api.deleteStory(project.id, storyId),
    onSuccess: refreshProject,
  });

  const refine = useMutation({
    mutationFn: () => api.executeRequirements(project.id),
    // Aunque falle (por ejemplo PHASE_AWAITING_GATE), se refresca para mostrar el estado real.
    onSettled: () => invalidateWorkflow(queryClient),
  });

  function openForm(mode: StoryFormMode) {
    addStory.reset();
    setFormMode(mode);
  }

  const formProps = {
    onSubmit: (story: CreateStoryRequest) => addStory.mutate(story),
    onCancel: () => openForm(null),
    pending: addStory.isPending,
    error: addStory.error,
  };

  return (
    <section className={styles.section} aria-labelledby="stories-title">
      <div className={styles.sectionHead}>
        <h2 className={shared.sectionTitle} id="stories-title">
          Historias ({project.stories.length})
        </h2>
        {editable && (
          <div className={shared.actions}>
            <Button variant="outline" aria-pressed={formMode === 'existing'} onClick={() => openForm('existing')}>
              Ya tengo la historia
            </Button>
            <Button variant="outline" aria-pressed={formMode === 'assisted'} onClick={() => openForm('assisted')}>
              Ayúdame a construirla
            </Button>
          </div>
        )}
      </div>

      {progress === 'AWAITING_GATE' && (
        <p className={`${styles.banner} ${styles.bannerPending}`} role="status">
          <ClockIcon />
          Pendiente de aprobación del {approver}
          <Link to="/approvals">Ver en Por aprobar</Link>
        </p>
      )}
      {progress === 'APPROVED' && (
        <p className={`${styles.banner} ${styles.bannerApproved}`} role="status">
          <CheckIcon />
          Historias refinadas aprobadas por el {approver}
        </p>
      )}
      {editable && requirements && <LastDecisionNote step={requirements} />}

      {editable && formMode === 'existing' && <ExistingStoryForm {...formProps} />}
      {editable && formMode === 'assisted' && <AssistedStoryForm {...formProps} />}

      {project.stories.length === 0 ? (
        formMode === null && (
          <EmptyState
            title="Este proyecto aún no tiene historias"
            text="Agrega una historia que ya tengas escrita o constrúyela con ayuda."
            action={
              editable && (
                <div className={shared.actions}>
                  <Button onClick={() => openForm('existing')}>Ya tengo la historia</Button>
                  <Button variant="outline" onClick={() => openForm('assisted')}>
                    Ayúdame a construirla
                  </Button>
                </div>
              )
            }
          />
        )
      ) : (
        <ul className={shared.stack}>
          {project.stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              canDelete={editable}
              deleting={deleteStory.isPending}
              onDelete={() => deleteStory.mutate(story.id)}
            />
          ))}
        </ul>
      )}

      <ErrorMessage error={deleteStory.error} />
      <ErrorMessage error={refine.error} />

      {editable && (
        <div className={shared.actions}>
          <Button disabled={refine.isPending} onClick={() => refine.mutate()}>
            <SparkIcon size={20} />
            {refine.isPending ? 'El agente está refinando…' : 'Refinar con el agente'}
          </Button>
          <span className={shared.meta}>
            El agente de refinamiento trabaja sobre todas las historias; después decide el {approver}.
          </span>
        </div>
      )}
    </section>
  );
}

export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const api = useApi();
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
          <PageHeader
            title={project.data.name}
            subtitle={`Squad ${project.data.squad.name} · Recorrido por las fases y sus gates`}
            actions={
              <Pill tone="dark">
                Fase {PHASE_ORDER[project.data.currentPhase]} · {PHASE_LABELS[project.data.currentPhase]}
              </Pill>
            }
          />
          {project.data.description && (
            <Card as="section" aria-label="Descripción">
              <p className={styles.description}>{project.data.description}</p>
            </Card>
          )}
          <section className={styles.section} aria-labelledby="journey-title">
            <h2 className={shared.sectionTitle} id="journey-title">
              Recorrido
            </h2>
            <Journey steps={project.data.journey} />
          </section>
          <StoriesSection project={project.data} />
        </>
      )}
    </>
  );
}
