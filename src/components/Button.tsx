import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'approve' | 'outline' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Botón cuadrado solo con ícono: exige aria-label. */
  iconOnly?: boolean;
}

export function Button({ variant = 'primary', iconOnly = false, className, type = 'button', ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], iconOnly ? styles.iconOnly : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return <button type={type} className={classes} {...rest} />;
}

export function ButtonLink({
  to,
  variant = 'primary',
  children,
}: {
  to: string;
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`${styles.button} ${styles[variant]}`}>
      {children}
    </Link>
  );
}
