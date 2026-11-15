import { Logo, MenuIcon } from '../components/icons';
import styles from './TopBar.module.css';

interface TopBarProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
  userName: string;
  onLogout: () => void;
}

export function TopBar({ menuOpen, onToggleMenu, userName, onLogout }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo />
          <div className={styles.title}>IA SDLC · Panel de control</div>
        </div>
        <div className={styles.right}>
          <button
            type="button"
            className={styles.menuButton}
            aria-label={menuOpen ? 'Cerrar el menú' : 'Abrir el menú'}
            aria-expanded={menuOpen}
            aria-controls="side-menu"
            onClick={onToggleMenu}
          >
            <MenuIcon />
          </button>
          <span className={styles.user} title={userName}>
            {userName}
          </span>
          <button type="button" className={styles.logout} onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
