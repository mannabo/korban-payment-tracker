import React from 'react';
import { Search, Users, Calendar, DollarSign, MapPin, Phone, Mail } from 'lucide-react';

export const SimplePublicPortal: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-800 mb-2">
              Program Korban Hari Raya Haji 2026
            </h1>
            <p className="text-xl text-green-600 font-semibold mb-1">
              Masjid Al-Falah Kampung Hang Tuah
            </p>
            <p className="text-gray-600">
              Portal Semakan Progress Pembayaran Peserta
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Semak Progress Pembayaran Anda
          </h2>
          
          <div className="max-w-md mx-auto">
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-3">
              <Search className="h-5 w-5" />
              <span>Cari Nama Peserta</span>
            </button>
            <p className="text-center text-sm text-gray-600 mt-3">
              Masukkan nama anda untuk melihat progress pembayaran
            </p>
          </div>
        </div>

        {/* Program Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Maklumat Program
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-600" />
                <span className="text-gray-700">Jumlah: <strong>RM800</strong> per peserta</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                <span className="text-gray-700">Tempoh: <strong>8 bulan</strong> (Aug 2025 - Mar 2026)</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-purple-600" />
                <span className="text-gray-700">Bayaran bulanan: <strong>RM100</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Hubungi Kami
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-green-600" />
                <span className="text-gray-700">+60 12-345 6789</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                <span className="text-gray-700">korban@masjid-alfalah.org</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                <span className="text-gray-700">Setiap hari 9 AM - 6 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            Catatan Penting
          </h3>
          <ul className="text-amber-700 space-y-1 text-sm">
            <li>• Pembayaran perlu dijelaskan sebelum 31 Mac 2026</li>
            <li>• Setiap lembu korban mengandungi 7 bahagian</li>
            <li>• Peserta boleh membayar secara sekaligus atau ansuran</li>
            <li>• Untuk sebarang pertanyaan, hubungi pengurus masjid</li>
          </ul>
        </div>
      </main>
    </div>
  );
};