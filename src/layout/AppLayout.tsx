import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useApi } from '../api/apiContext';
import { USE_MOCKS } from '../api/config';
import { queryKeys } from '../api/queryKeys';
import { useAuth } from '../auth/authContext';
import styles from './AppLayout.module.css';
import { SideMenu } from './SideMenu';
import { TopBar } from './TopBar';

export function AppLayout() {
  const api = useApi();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(true);
  const pending = useQuery({ queryKey: queryKeys.approvals, queryFn: () => api.listPendingApprovals() });

  return (
    <div className={styles.shell}>
      <TopBar
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        userName={user?.fullName ?? ''}
        onLogout={logout}
      />
      <div className={styles.body}>
        {menuOpen && <SideMenu pendingApprovals={pending.data?.length ?? 0} />}
        <main className={styles.content}>
          {USE_MOCKS && <span className={styles.demo}>Datos de ejemplo</span>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
