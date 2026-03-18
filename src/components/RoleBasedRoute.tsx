import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'user')[];
  requiredRole?: 'admin' | 'user';
  fallback?: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  requiredRole,
  fallback,
}) => {
  const { user, isAuthenticated } = useAuth();

  const denied = (msg: string) =>
    fallback || (
      <div style={{
        padding: '16px 20px', borderRadius: '12px',
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        color: '#ef4444', fontSize: '0.875rem',
      }}>
        {msg}
      </div>
    );

  if (!isAuthenticated || !user) return denied('Access denied. Please log in.');

  const roles = allowedRoles ?? (requiredRole ? [requiredRole] : []);
  if (roles.length > 0 && !roles.includes(user.role as 'admin' | 'user')) {
    return denied('Access denied. Insufficient permissions.');
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
