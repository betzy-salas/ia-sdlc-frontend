import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorMessage } from '../components/ErrorMessage';
import { TextField } from '../components/Fields';
import { Logo } from '../components/icons';
import { useAuth } from './authContext';
import styles from './AuthPages.module.css';

export function RegisterPage() {
  const { status, register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') return <Navigate to="/" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password });
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
        <h1 className={styles.title}>Crear cuenta</h1>
        <p className={styles.subtitle}>Después, alguien de tu squad te asigna un rol.</p>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField label="Nombre completo" autoComplete="name" required value={fullName} onChange={setFullName} />
          <TextField label="Correo" type="email" autoComplete="email" required value={email} onChange={setEmail} />
          <TextField
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={setPassword}
          />
          <ErrorMessage error={error} />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>
        <p className={styles.switch}>
          ¿Ya tienes cuenta? <Link to="/login">Ingresa</Link>
        </p>
      </Card>
    </main>
  );
}
