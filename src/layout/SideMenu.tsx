import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AgentsIcon,
  ApprovalsIcon,
  ExecutionsIcon,
  HomeIcon,
  ProjectsIcon,
  SquadsIcon,
} from '../components/icons';
import styles from './SideMenu.module.css';

interface MenuOption {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const OPTIONS: MenuOption[] = [
  { to: '/', label: 'Inicio', icon: <HomeIcon />, end: true },
  { to: '/projects', label: 'Proyectos', icon: <ProjectsIcon /> },
  { to: '/approvals', label: 'Por aprobar', icon: <ApprovalsIcon /> },
  { to: '/agents', label: 'Agentes', icon: <AgentsIcon /> },
  { to: '/executions', label: 'Ejecuciones', icon: <ExecutionsIcon /> },
  { to: '/squads', label: 'Squads y roles', icon: <SquadsIcon /> },
];

/** Menú lateral. Elegir una opción solo navega: abrirlo y cerrarlo es cosa del botón de la barra. */
export function SideMenu({ pendingApprovals }: { pendingApprovals: number }) {
  return (
    <nav id="side-menu" aria-label="Menú" className={styles.menu}>
      {OPTIONS.map((option) => (
        <NavLink
          key={option.to}
          to={option.to}
          end={option.end}
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
        >
          {option.icon}
          <span className={styles.label}>{option.label}</span>
          {option.to === '/approvals' && pendingApprovals > 0 && (
            <span className={styles.count}>
              {pendingApprovals}
              <span className="visually-hidden">{pendingApprovals === 1 ? ' pendiente' : ' pendientes'}</span>
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
