import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import styles from './Layout.module.css';

export function AppShell() {
  return (
    <div className={styles.appShell}>
      <header className={styles.header}>ProteinTracker</header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
