import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import { ShieldX } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF7F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-10 w-10 border-3 border-[#9B1C31] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#66615C]">Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mb-4">
          <ShieldX className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-[#2B2B2B]">Access Restricted</h2>
        <p className="text-sm text-[#66615C] max-w-md mt-2 mb-6">
          Your current account role (<span className="font-semibold text-[#9B1C31]">{role}</span>) does not have authorization to view this management module.
        </p>
        <Button variant="primary" onClick={() => window.history.back()}>
          Return to Previous Page
        </Button>
      </div>
    );
  }

  return children;
};
