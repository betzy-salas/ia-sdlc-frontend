import { useId, useState } from 'react';
import type { Decision } from '../../api/types';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import fields from '../../components/Fields.module.css';
import shared from '../../components/shared.module.css';

interface DecisionFormProps {
  onDecide: (decision: Decision, comment: string) => void;
  pending: boolean;
  /** Error devuelto por el back al decidir. */
  error: unknown;
}

const COMMENT_REQUIRED = 'Escribe un comentario para pedir cambios o rechazar.';

/** Acciones del gate. Pedir cambios y Rechazar exigen comentario; Aprobar no. */
export function DecisionForm({ onDecide, pending, error }: DecisionFormProps) {
  const commentId = useId();
  const [comment, setComment] = useState('');
  const [missingComment, setMissingComment] = useState(false);

  function decide(decision: Decision) {
    const text = comment.trim();
    if (decision !== 'APPROVE' && !text) {
      setMissingComment(true);
      document.getElementById(commentId)?.focus();
      return;
    }
    setMissingComment(false);
    onDecide(decision, text);
  }

  return (
    <div className={shared.form}>
      <div className={fields.field}>
        <label className={fields.label} htmlFor={commentId}>
          Comentario
        </label>
        <textarea
          id={commentId}
          className={fields.control}
          rows={3}
          value={comment}
          aria-describedby={`${commentId}-hint`}
          aria-invalid={missingComment}
          onChange={(event) => {
            setComment(event.target.value);
            if (event.target.value.trim()) setMissingComment(false);
          }}
        />
        <span className={fields.hint} id={`${commentId}-hint`}>
          Obligatorio para pedir cambios o rechazar; opcional para aprobar.
        </span>
      </div>
      <ErrorMessage error={missingComment ? COMMENT_REQUIRED : error} />
      <div className={shared.actions}>
        <Button variant="approve" disabled={pending} onClick={() => decide('APPROVE')}>
          Aprobar
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => decide('REQUEST_REWORK')}>
          Pedir cambios
        </Button>
        <Button variant="danger" disabled={pending} onClick={() => decide('REJECT')}>
          Rechazar
        </Button>
      </div>
    </div>
  );
}
