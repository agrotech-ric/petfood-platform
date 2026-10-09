import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const PrivateRoute = ({ children, allowedRoles }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: 'var(--color-text-muted)'
      }}>
        {t('common.loading')}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={user?.role === 'ADMIN' ? "/admin/users" : "/dashboard"} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
