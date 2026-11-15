import { toErrorInfo } from '../api/ApiError';
import styles from './ErrorMessage.module.css';
import { AlertIcon } from './icons';

/** Error de una acción (formulario, ejecutar, decidir): el `{ code, message }` del back tal cual. */
export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  const info = typeof error === 'string' ? { message: error, code: null } : toErrorInfo(error);
  return (
    <div className={styles.error} role="alert">
      <span className={styles.icon}>
        <AlertIcon size={20} />
      </span>
      <span>
        {info.message}
        {info.code && <span className={styles.code}>Código: {info.code}</span>}
      </span>
    </div>
  );
}
