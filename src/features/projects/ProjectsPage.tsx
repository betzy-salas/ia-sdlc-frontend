import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../api/apiContext';
import { queryKeys } from '../../api/queryKeys';
import { Button, ButtonLink } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorMessage } from '../../components/ErrorMessage';
import { SelectField, TextAreaField, TextField } from '../../components/Fields';
import { PageHeader } from '../../components/PageHeader';
import { Pill } from '../../components/Pill';
import { ProjectsIcon } from '../../components/icons';
import shared from '../../components/shared.module.css';
import styles from './Projects.module.css';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';

function NewProjectForm({ onClose }: { onClose: () => void }) {
  const api = useApi();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const squads = useQuery({ queryKey: queryKeys.squads, queryFn: () => api.listSquads() });
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [squadId, setSquadId] = useState('');

  const create = useMutation({
    mutationFn: () => api.createProject({ name: name.trim(), description: description.trim(), squadId }),
    onSuccess: async (project) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
      navigate(`/projects/${project.id}`);
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    create.mutate();
  }

  const noSquads = squads.isSuccess && squads.data.length === 0;

  return (
    <Card as="section" aria-label="Nuevo proyecto">
      <h2 className={shared.sectionTitle}>Nuevo proyecto</h2>
      <form className={shared.form} onSubmit={handleSubmit}>
        <TextField label="Nombre" required value={name} onChange={setName} />
        <TextAreaField label="Descripción" value={description} onChange={setDescription} />
        <SelectField
          label="Squad"
          required
          value={squadId}
          onChange={setSquadId}
          placeholder={squads.isPending ? 'Cargando squads…' : 'Elige un squad'}
          options={(squads.data ?? []).map((squad) => ({ value: squad.id, label: squad.name }))}
          hint="El squad vale para todas las iniciativas del proyecto: sus roles aprueban los gates."
        />
        {noSquads && (
          <p className={shared.meta}>
            Aún no hay squads. <Link to="/squads">Crea uno en Squads y roles</Link>.
          </p>
        )}
        <ErrorMessage error={squads.error ?? create.error} />
        <div className={shared.actions}>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creando…' : 'Crear proyecto'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function ProjectsPage() {
  const api = useApi();
  const [creating, setCreating] = useState(false);
  const projects = useQuery({ queryKey: queryKeys.projectList, queryFn: () => api.listProjects() });

  return (
    <>
      <PageHeader
        title="Proyectos"
        subtitle="Un proyecto agrupa iniciativas; cada iniciativa recorre las cinco fases con sus historias."
        actions={!creating && <Button onClick={() => setCreating(true)}>Nuevo proyecto</Button>}
      />
      {creating && <NewProjectForm onClose={() => setCreating(false)} />}
      {projects.isPending ? (
        <LoadingState label="Cargando proyectos…" />
      ) : projects.isError ? (
        <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />
      ) : projects.data.length === 0 ? (
        !creating && (
          <EmptyState
            title="Aún no hay proyectos"
            text="Crea el primero y luego sus iniciativas, para agregar historias y refinarlas con el agente."
            action={<Button onClick={() => setCreating(true)}>Nuevo proyecto</Button>}
          />
        )
      ) : (
        <ul className={shared.stack}>
          {projects.data.map((project) => (
            <Card as="li" row key={project.id}>
              <div className={styles.projectIcon} aria-hidden="true">
                <ProjectsIcon size={22} />
              </div>
              <div className={shared.main}>
                <h2 className={shared.itemTitle}>
                  <Link to={`/projects/${project.id}`}>{project.name}</Link>
                </h2>
                <p className={shared.meta}>Squad {project.squad.name}</p>
              </div>
              <Pill>
                {project.initiativeCount} {project.initiativeCount === 1 ? 'iniciativa' : 'iniciativas'}
              </Pill>
              <ButtonLink to={`/projects/${project.id}`} variant="outline">
                Abrir<span className="visually-hidden"> {project.name}</span>
              </ButtonLink>
            </Card>
          ))}
        </ul>
      )}
    </>
  );
}
