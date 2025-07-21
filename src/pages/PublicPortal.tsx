import React, { useState } from 'react';
import { ParticipantLookup } from '../components/ParticipantLookup';
import { PublicParticipantDashboard } from '../components/PublicParticipantDashboard';
import { AdminLoginButton } from '../components/AdminLoginButton';
import { Search, Users, Calendar, DollarSign, MapPin, Clock, Phone, Mail } from 'lucide-react';

interface PublicPortalProps {
  onShowAdminLogin?: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ onShowAdminLogin }) => {
  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; name: string; groupId: string } | null>(null);
  const [showLookup, setShowLookup] = useState(false);

  const handleParticipantSelected = (participant: { id: string; name: string; groupId: string }) => {
    setSelectedParticipant(participant);
    setShowLookup(false);
  };

  const handleBackToPortal = () => {
    setSelectedParticipant(null);
    setShowLookup(false);
  };

  if (selectedParticipant) {
    return (
      <PublicParticipantDashboard 
        participantId={selectedParticipant.id} 
        participantName={selectedParticipant.name}
        onBack={handleBackToPortal}
      />
    );
  }

  if (showLookup) {
    return (
      <ParticipantLookup 
        onParticipantSelected={handleParticipantSelected}
        onBack={handleBackToPortal}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="text-center flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-green-800 mb-2">
                Program Korban Hari Raya Haji 2026
              </h1>
              <p className="text-xl text-green-600 font-semibold mb-1">
                Masjid Al-Falah Kampung Hang Tuah
              </p>
              <p className="text-gray-600">
                Portal Semakan Progress Pembayaran Peserta
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              {onShowAdminLogin && (
                <AdminLoginButton onShowAdminLogin={onShowAdminLogin} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Program Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Program Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Calendar className="h-6 w-6 mr-3 text-green-600" />
                Maklumat Program
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Tempoh Kutipan</h3>
                    <p className="text-green-700">Ogos 2025 - Mac 2026</p>
                    <p className="text-sm text-green-600 mt-1">8 bulan kutipan</p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">Jumlah Korban</h3>
                    <p className="text-blue-700 text-xl font-bold">RM800</p>
                    <p className="text-sm text-blue-600 mt-1">per peserta (RM100 x 8 bulan)</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Cara Pembayaran</h3>
                  <div className="space-y-2 text-gray-700">
                    <p className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                      Bayaran bulanan: RM100 x 8 bulan
                    </p>
                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                      Tarikh: Setiap minggu pertama bulan
                    </p>
                    <p className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                      Tempat: Masjid Al-Falah atau melalui pengurus kumpulan
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-lg p-6">
                  <h3 className="font-semibold text-amber-800 mb-3">Catatan Penting</h3>
                  <ul className="space-y-2 text-amber-700 text-sm">
                    <li>• Pembayaran perlu dijelaskan sebelum 31 Mac 2026</li>
                    <li>• Setiap lembu korban mengandungi 7 bahagian</li>
                    <li>• Bayaran yang tertunggak akan dikenakan yuran lewat</li>
                    <li>• Peserta boleh membayar secara sekaligus atau ansuran</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Main Action */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                Semak Progress Anda
              </h3>
              <button
                onClick={() => setShowLookup(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3"
              >
                <Search className="h-5 w-5" />
                <span>Cari Nama Peserta</span>
              </button>
              <p className="text-center text-sm text-gray-600 mt-3">
                Masukkan nama anda untuk melihat progress pembayaran
              </p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Program Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-gray-700">Total Peserta</span>
                  </div>
                  <span className="font-semibold text-blue-600">Loading...</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-gray-700">Progress Kutipan</span>
                  </div>
                  <span className="font-semibold text-green-600">Loading...</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Hubungi Kami</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Phone className="h-4 w-4 mr-3 text-green-600" />
                  <span className="text-sm">+60 12-345 6789</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="h-4 w-4 mr-3 text-blue-600" />
                  <span className="text-sm">korban@masjid-alfalah.org</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock className="h-4 w-4 mr-3 text-purple-600" />
                  <span className="text-sm">Setiap hari 9 AM - 6 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 py-8">
          <p className="text-sm">
            © 2025 Masjid Al-Falah Kampung Hang Tuah. Semua hak terpelihara.
          </p>
          <p className="text-xs mt-2">
            Untuk sebarang pertanyaan, sila hubungi pengurus masjid.
          </p>
        </div>
      </main>
    </div>
  );
};