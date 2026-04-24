import { ReactNode } from 'react';
import { Sidebar } from '../src/components/Sidebar';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const Layout = ({ children, showSidebar = false }: LayoutProps) => {
  return (
    <div className={styles.layoutContainer}>
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? styles.mainWithSidebar : styles.mainFullWidth}>
        {children}
      </main>
    </div>
  );
};