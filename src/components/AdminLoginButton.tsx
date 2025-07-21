import React from 'react';
import { Shield } from 'lucide-react';

interface AdminLoginButtonProps {
  onShowAdminLogin: () => void;
}

export const AdminLoginButton: React.FC<AdminLoginButtonProps> = ({ onShowAdminLogin }) => {
  return (
    <button
      onClick={onShowAdminLogin}
      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
    >
      <Shield className="h-4 w-4" />
      <span className="text-sm">Admin Login</span>
    </button>
  );
};