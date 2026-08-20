import PrivateRoute from '../components/PrivateRoute';
import type { UserRole } from '../../context/AuthContext';
import { AppLayout } from './AppLayout';

type PrivateLayoutRouteProps = {
  allowedRoles: UserRole[];
};

export function PrivateLayoutRoute({ allowedRoles }: PrivateLayoutRouteProps) {
  return (
    <PrivateRoute allowedRoles={allowedRoles}>
      <AppLayout />
    </PrivateRoute>
  );
}
