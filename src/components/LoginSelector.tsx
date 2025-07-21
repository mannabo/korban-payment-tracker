import React, { useState } from 'react';
import LoginForm from './LoginForm';
import { ParticipantLoginForm } from './ParticipantLoginForm';
import { Shield, User } from 'lucide-react';

type LoginMode = 'select' | 'admin' | 'participant';

export const LoginSelector: React.FC = () => {
  const [loginMode, setLoginMode] = useState<LoginMode>('select');

  if (loginMode === 'admin') {
    return <LoginForm />;
  }

  if (loginMode === 'participant') {
    return <ParticipantLoginForm onToggleMode={() => setLoginMode('admin')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Korban Payment Tracker
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Pilih jenis login anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            <button
              onClick={() => setLoginMode('participant')}
              className="w-full flex items-center justify-center px-4 py-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <User className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="text-lg font-semibold">Peserta</div>
                <div className="text-sm text-blue-100">Lihat progress pembayaran anda</div>
              </div>
            </button>

            <button
              onClick={() => setLoginMode('admin')}
              className="w-full flex items-center justify-center px-4 py-6 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Shield className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="text-lg font-semibold">Admin</div>
                <div className="text-sm text-gray-500">Pengurusan sistem</div>
              </div>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Jika anda tidak pasti, pilih "Peserta" untuk melihat progress pembayaran anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};