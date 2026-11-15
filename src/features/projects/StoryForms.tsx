import { useState, type FormEvent } from 'react';
import type { CreateStoryRequest } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ErrorMessage } from '../../components/ErrorMessage';
import { TextAreaField, TextField } from '../../components/Fields';
import shared from '../../components/shared.module.css';
import { buildAssistedStory } from './assistedStory';
import styles from './ProjectDetailPage.module.css';

interface StoryFormProps {
  onSubmit: (story: CreateStoryRequest) => void;
  onCancel: () => void;
  pending: boolean;
  error: unknown;
}

/** "Ya tengo la historia": título y descripción tal como vienen (origin EXISTING). */
export function ExistingStoryForm({ onSubmit, onCancel, pending, error }: StoryFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ title: title.trim(), description: description.trim(), origin: 'EXISTING' });
  }

  return (
    <Card as="section" aria-label="Ya tengo la historia">
      <h3 className={styles.formTitle}>Ya tengo la historia</h3>
      <form className={shared.form} onSubmit={handleSubmit}>
        <TextField label="Título" required value={title} onChange={setTitle} />
        <TextAreaField
          label="Descripción"
          required
          rows={4}
          value={description}
          onChange={setDescription}
          hint="Pégala como la tengas; el agente la refina después."
        />
        <ErrorMessage error={error} />
        <div className={shared.actions}>
          <Button type="submit" disabled={pending}>
            {pending ? 'Agregando…' : 'Agregar historia'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

/** "Ayúdame a construirla": tres preguntas que arman título y descripción (origin ASSISTED). */
export function AssistedStoryForm({ onSubmit, onCancel, pending, error }: StoryFormProps) {
  const [who, setWho] = useState('');
  const [what, setWhat] = useState('');
  const [why, setWhy] = useState('');
  const draft = buildAssistedStory(who, what, why);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ title: draft.title, description: draft.description, origin: 'ASSISTED' });
  }

  return (
    <Card as="section" aria-label="Ayúdame a construirla">
      <h3 className={styles.formTitle}>Ayúdame a construirla</h3>
      <form className={shared.form} onSubmit={handleSubmit}>
        <TextField
          label="¿Quién la necesita?"
          required
          value={who}
          onChange={setWho}
          placeholder="cliente con cuenta de ahorros"
        />
        <TextField
          label="¿Qué quiere hacer?"
          required
          value={what}
          onChange={setWhat}
          placeholder="ver sus últimos movimientos"
        />
        <TextField
          label="¿Para qué?"
          required
          value={why}
          onChange={setWhy}
          placeholder="controlar sus gastos"
        />
        <div className={styles.preview} aria-live="polite">
          <p className={styles.previewLabel}>Así quedará la historia</p>
          {draft.description ? (
            <>
              <p className={styles.previewTitle}>{draft.title}</p>
              <p>{draft.description}</p>
            </>
          ) : (
            <p className={shared.meta}>Responde las tres preguntas para ver la historia armada.</p>
          )}
        </div>
        <ErrorMessage error={error} />
        <div className={shared.actions}>
          <Button type="submit" disabled={pending}>
            {pending ? 'Agregando…' : 'Agregar historia'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
