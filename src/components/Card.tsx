import type { HTMLAttributes } from 'react';
import type { PhaseCode } from '../api/types';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'article' | 'section' | 'div' | 'li';
  /** Contenido en fila (ícono de fase + texto + estado), como en las listas. */
  row?: boolean;
  /** Atenuada: sin sombra y con fondo gris (fases no alcanzadas). */
  muted?: boolean;
  /** Activa los colores de la fase para el contenido. */
  phase?: PhaseCode;
}

export function Card({ as: Tag = 'article', row, muted, phase, className, ...rest }: CardProps) {
  const classes = [styles.card, row ? styles.row : '', muted ? styles.muted : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  return <Tag className={classes} data-phase={phase} {...rest} />;
}
