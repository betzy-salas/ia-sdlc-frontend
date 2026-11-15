import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { USE_MOCKS } from '../api/config';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorMessage } from '../components/ErrorMessage';
import { TextField } from '../components/Fields';
import { Logo } from '../components/icons';
import { DEMO_PASSWORD, DEMO_USERS } from '../mocks/seed';
import { useAuth } from './authContext';
import styles from './AuthPages.module.css';

export function LoginPage() {
  const { status, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/'} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
    } catch (caught) {
      setError(caught);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.brand}>
        <Logo />
        IA SDLC · Panel de control
      </div>
      <Card className={styles.card}>
        <h1 className={styles.title}>Ingresar</h1>
        <p className={styles.subtitle}>En cada fase un agente propone y una persona aprueba.</p>
        {USE_MOCKS && (
          <p className={styles.demo}>
            Modo demo, sin backend. Ingresa como Product Owner con{' '}
            <strong>{DEMO_USERS.productOwner.email}</strong> y la contraseña <strong>{DEMO_PASSWORD}</strong>.
          </p>
        )}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField label="Correo" type="email" autoComplete="email" required value={email} onChange={setEmail} />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
          />
          <ErrorMessage error={error} />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </Button>
        </form>
        <p className={styles.switch}>
          ¿Aún no tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </Card>
    </main>
  );
}
