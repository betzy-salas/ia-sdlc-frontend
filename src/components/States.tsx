import type { ReactNode } from 'react';
import { toErrorInfo } from '../api/ApiError';
import { Button } from './Button';
import { AlertIcon } from './icons';
import styles from './States.module.css';

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.text}>{label}</p>
    </div>
  );
}

/** Estado vacío: explica qué falta y ofrece la acción para empezar. */
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className={styles.state}>
      <p className={styles.title}>{title}</p>
      {text && <p className={styles.text}>{text}</p>}
      {action}
    </div>
  );
}

/** Estado de error de una consulta: muestra el mensaje del back y permite reintentar. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const info = toErrorInfo(error);
  return (
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <p className={styles.title}>
        <AlertIcon />
        No se pudo cargar
      </p>
      <p className={styles.text}>{info.message}</p>
      {info.code && <p className={styles.code}>Código: {info.code}</p>}
      <Button variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
