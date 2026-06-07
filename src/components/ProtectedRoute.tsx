import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  session: any;
  children: React.ReactNode;
}

export default function ProtectedRoute({ session, children }: ProtectedRouteProps) {
  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}