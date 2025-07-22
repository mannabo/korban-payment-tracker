import React, { useState, useEffect } from 'react';
import { Users, Calendar, DollarSign, MapPin, Phone, Mail, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { GroupListing } from '../components/GroupListing';
import { PublicParticipantDashboard } from '../components/PublicParticipantDashboard';
import { getAllParticipants, getGroups, getPaymentsByParticipant } from '../utils/firestore';

interface StyledPublicPortalProps {
  onShowAdminLogin?: () => void;
  showReturnToAdmin?: boolean;
  onReturnToAdmin?: () => void;
}

export const StyledPublicPortal: React.FC<StyledPublicPortalProps> = ({ 
  onShowAdminLogin, 
  showReturnToAdmin = false, 
  onReturnToAdmin 
}) => {
  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; name: string; groupId: string } | null>(null);
  const [showGroupListing, setShowGroupListing] = useState(false);
  const [stats, setStats] = useState({ totalParticipants: 0, totalGroups: 0, collectionProgress: 0 });
  const [openFaqItems, setOpenFaqItems] = useState<{ [key: number]: boolean }>({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSmallMobile, setIsSmallMobile] = useState(window.innerWidth < 400);

  const handleParticipantSelected = (participant: { id: string; name: string; groupId: string }) => {
    setSelectedParticipant(participant);
    setShowGroupListing(false);
  };

  const handleBackToPortal = () => {
    setSelectedParticipant(null);
    setShowGroupListing(false);
  };

  const handleViewGroupsClick = () => {
    setShowGroupListing(true);
  };

  const handleAdminClick = () => {
    if (showReturnToAdmin && onReturnToAdmin) {
      onReturnToAdmin();
    } else if (onShowAdminLogin) {
      onShowAdminLogin();
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaqItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const faqData = [
    {
      question: "Apakah Program Korban Perdana?",
      answer: "Program ini dianjurkan oleh Masjid Al-Falah untuk memudahkan penduduk Kampung Hang Tuah melaksanakan ibadah korban secara berkelompok sempena Hari Raya Haji. Seekor lembu dibahagikan kepada 7 bahagian, setiap bahagian untuk satu nama peserta."
    },
    {
      question: "Siapa boleh menyertai program ini?",
      answer: "Program ini terbuka kepada semua penduduk Kampung Hang Tuah yang ingin melaksanakan ibadah korban. Tidak terhad kepada jantina atau umur, asalkan peserta mampu membayar sumbangan."
    },
    {
      question: "Berapa kos untuk menyertai?",
      answer: "Kos setiap bahagian: RM800 untuk 1/7 bahagian seekor lembu. Pilihan pembayaran: Ansuran RM100 sebulan selama 8 bulan (bermula Ogos 2025) atau bayar penuh RM800 sekaligus."
    },
    {
      question: "Bagaimana cara pembayaran diuruskan?",
      answer: "Pembayaran dikutip oleh bendahari Masjid Al-Falah. Resit akan diberikan untuk setiap pembayaran. Peserta akan diingatkan melalui group WhatsApp untuk bayaran bulanan."
    },
    {
      question: "Bilakah tarikh program ini?",
      answer: "Program akan diadakan pada Hari Raya Haji (anggaran Mei 2026, tarikh tepat akan disahkan kemudian). Aktiviti bermula jam 9:30 pagi di pusat sembelihan bersebelahan Masjid Al-Falah."
    },
    {
      question: "Bagaimana proses sembelihan dijalankan?",
      answer: "Sembelihan dilakukan oleh penyembelih bertauliah mengikut syariat Islam. Lembu diperoleh daripada pembekal bertauliah yang memastikan haiwan sihat dan memenuhi syarat korban."
    },
    {
      question: "Bagaimana daging korban diagihkan?",
      answer: "Daging dibahagikan mengikut syariat: 1/3 untuk peserta korban (setiap peserta mendapat bahagian adil dari 1/7 lembu), 1/3 untuk fakir miskin dan golongan memerlukan di Kampung Hang Tuah, 1/3 untuk kegunaan komuniti (contoh: masjid atau acara amal)."
    },
    {
      question: "Bagaimana cara mendaftar?",
      answer: "Isi borang pendaftaran yang tersedia di pejabat masjid atau melalui pautan Google Form (akan dikongsi kemudian). Berikan nama penuh, nombor telefon, pilihan pembayaran, dan niat (korban sunat, aqiqah, atau nazar). Tarikh akhir pendaftaran: 1 bulan sebelum Hari Raya Haji (akan diumumkan)."
    },
    {
      question: "Adakah perlu hadir semasa sembelihan?",
      answer: "Tidak wajib, tetapi peserta digalakkan hadir untuk melihat proses sembelihan dan mengambil bahagian daging. Jika tidak dapat hadir, daging akan diuruskan untuk dihantar atau disimpan."
    },
    {
      question: "Apa yang perlu dilakukan jika saya tidak dapat meneruskan ansuran?",
      answer: "Sila beritahu bendahari atau jawatankuasa secepat mungkin. Kami akan bincang untuk mencari penyelesaian, seperti mencari peserta gantian."
    },
    {
      question: "Siapa yang menguruskan program ini?",
      answer: "Program diuruskan oleh jawatankuasa Masjid Al-Falah, termasuk: Pengerusi (Imam Masjid Al-Falah), Bendahari (mengurus kewangan), dan Pasukan logistik dan pembahagian."
    },
    {
      question: "Bolehkah peserta korban dan aqiqah dicampur dalam satu lembu?",
      answer: "Menurut Mazhab Syafi'i, boleh dicampurkan niat korban dan aqiqah dalam seekor lembu (7 bahagian). Namun, untuk memudahkan pelaksanaan, kami mengasingkan lembu korban dan aqiqah. Sila maklumkan niat anda (korban atau aqiqah) semasa mendaftar."
    },
    {
      question: "Bolehkah buat korban untuk nazar dalam program ini?",
      answer: "Ya, menurut Mazhab Syafi'i, boleh mencampur niat korban sunat dan nazar dalam seekor lembu. Namun, untuk memudahkan agihan, kami mengasingkan lembu untuk korban nazar jika cukup peserta (7 orang). Daging korban nazar akan disedekahkan sepenuhnya kepada fakir miskin. Sila maklumkan niat anda (sunat atau nazar) semasa mendaftar."
    },
    {
      question: "Apakah jenis-jenis korban yang ada?",
      answer: "Terdapat beberapa jenis korban dalam Islam: Korban Sunat (dilakukan sempena Hari Raya Haji, daging diagihkan kepada peserta, fakir miskin, dan komuniti), Korban Nazar (wajib bagi yang bernazar, daging disedekahkan sepenuhnya kepada fakir miskin), Korban Wajib (untuk jemaah haji Tamattu' atau Qiran, dilakukan di Makkah), dan Korban Kaffarah (untuk tebus dosa tertentu, seperti melanggar ihram). Program Korban Perdana fokus pada korban sunat dan boleh terima nazar (dengan agihan daging khusus). Sila nyatakan niat anda semasa mendaftar."
    },
    {
      question: "Bagaimana saya boleh mendapatkan maklumat lanjut?",
      answer: "Tanya di group WhatsApp ini, hubungi Noor Azman bin Omar di 014-6168216, atau hadiri mesyuarat penduduk yang akan diadakan (tarikh akan diumumkan)."
    }
  ];

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth < 400);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load stats on component mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [participants, groups] = await Promise.all([
          getAllParticipants(),
          getGroups()
        ]);
        
        // Calculate real collection progress
        let totalPaidAmount = 0;
        let totalExpectedAmount = participants.length * 800; // RM800 total per participant (8 months x RM100)
        
        // Get all payments to calculate actual collection progress
        try {
          const allPaymentsPromises = participants.map(participant => 
            getPaymentsByParticipant(participant.id)
          );
          const allPayments = await Promise.all(allPaymentsPromises);
          
          // Calculate total paid amount
          allPayments.forEach(payments => {
            payments.forEach(payment => {
              if (payment.isPaid) {
                totalPaidAmount += payment.amount || 100; // Default RM100 per month
              }
            });
          });
        } catch (paymentError) {
          console.error('Failed to calculate real collection progress:', paymentError);
          // Set to 0 if payment calculation fails
          totalPaidAmount = 0;
        }
        
        const collectionProgress = totalExpectedAmount > 0 ? Math.round((totalPaidAmount / totalExpectedAmount) * 100) : 0;
        
        setStats({
          totalParticipants: participants.length,
          totalGroups: groups.length,
          collectionProgress
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
        // Set empty stats if Firebase fails
        setStats({
          totalParticipants: 0,
          totalGroups: 0,
          collectionProgress: 0
        });
      }
    };

    loadStats();
  }, []);

  // Show participant dashboard if selected
  if (selectedParticipant) {
    return (
      <PublicParticipantDashboard 
        participantId={selectedParticipant.id} 
        participantName={selectedParticipant.name}
        onBack={handleBackToPortal}
      />
    );
  }

  // Show group listing if requested
  if (showGroupListing) {
    return (
      <GroupListing 
        onParticipantSelected={handleParticipantSelected}
        onBack={handleBackToPortal}
      />
    );
  }

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)' 
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.1
        }}></div>
        
        <div className="container mx-auto" style={{ 
          padding: 'clamp(2rem, 5vw, 3rem) 1rem',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ 
            textAlign: 'center',
            width: '100%',
            maxWidth: '1200px'
          }}>
            {/* Logo/Icon */}
            <div style={{
              width: 'clamp(60px, 12vw, 80px)',
              height: 'clamp(60px, 12vw, 80px)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              <div style={{
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                color: 'white'
              }}>
                🕌
              </div>
            </div>

            {/* Main Title */}
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '1rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              lineHeight: '1.1',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              textAlign: 'center',
              width: '100%'
            }}>
              Program Korban Perdana Hari Raya Haji 2026
            </h1>

            {/* Subtitle */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2rem)',
              margin: '0 auto 1rem auto',
              maxWidth: '600px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              width: '100%',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                color: 'white',
                fontWeight: '600',
                marginBottom: '0.5rem',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                textAlign: 'center'
              }}>
                Masjid Al-Falah Kampung Hang Tuah
              </p>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: 'clamp(1rem, 3vw, 1.1rem)',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                textAlign: 'center'
              }}>
                Portal Semakan Progress Pembayaran Peserta
              </p>
            </div>

            {/* Stats Banner */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginTop: '2rem',
              width: '100%'
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                padding: '1rem 1.5rem',
                textAlign: 'center',
                minWidth: '120px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                flex: '1 1 auto',
                maxWidth: '150px'
              }}>
                <div style={{
                  fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                  fontWeight: 'bold',
                  color: 'white',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}>
                  {stats.totalParticipants}
                </div>
                <div style={{
                  fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}>
                  Peserta
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                padding: '1rem 1.5rem',
                textAlign: 'center',
                minWidth: '120px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                flex: '1 1 auto',
                maxWidth: '150px'
              }}>
                <div style={{
                  fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                  fontWeight: 'bold',
                  color: 'white',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}>
                  {stats.totalGroups}
                </div>
                <div style={{
                  fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}>
                  Kumpulan
                </div>
              </div>
              
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '8px',
                padding: '1rem 1.5rem',
                textAlign: 'center',
                minWidth: '120px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                flex: '1 1 auto',
                maxWidth: '150px'
              }}>
                <div style={{
                  fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                  fontWeight: 'bold',
                  color: 'white',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}>
                  {stats.collectionProgress}%
                </div>
                <div style={{
                  fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                }}>
                  Progress
                </div>
              </div>
            </div>

            {/* Admin Access Button - Mobile Responsive */}
            <div style={{
              position: 'absolute',
              top: 'clamp(0.75rem, 3vw, 1rem)',
              right: 'clamp(0.75rem, 3vw, 1rem)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <button 
                onClick={handleAdminClick}
                style={{
                  backgroundColor: showReturnToAdmin ? 'rgba(5, 150, 105, 0.95)' : 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: showReturnToAdmin ? '1px solid rgba(5, 150, 105, 0.6)' : '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 'clamp(6px, 2vw, 8px)',
                  padding: 'clamp(0.4rem, 2vw, 0.6rem) clamp(0.6rem, 3vw, 1rem)',
                  cursor: 'pointer',
                  fontSize: 'clamp(0.7rem, 2.2vw, 0.875rem)',
                  fontWeight: '500',
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.3s ease',
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                  boxShadow: showReturnToAdmin 
                    ? '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.1)' 
                    : '0 2px 6px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(0.25rem, 1vw, 0.5rem)',
                  maxWidth: isSmallMobile ? '100px' : isMobile ? '120px' : 'none',
                  overflow: isSmallMobile ? 'hidden' : 'visible',
                  textOverflow: isSmallMobile ? 'ellipsis' : 'unset'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = showReturnToAdmin ? 'rgba(5, 150, 105, 1)' : 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                  e.currentTarget.style.boxShadow = showReturnToAdmin 
                    ? '0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.15)' 
                    : '0 3px 10px rgba(0,0,0,0.2), 0 1px 3px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = showReturnToAdmin ? 'rgba(5, 150, 105, 0.95)' : 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = showReturnToAdmin 
                    ? '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.1)' 
                    : '0 2px 6px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)';
                }}
              >
                <span style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)' }}>
                  {showReturnToAdmin ? '🔙' : '👤'}
                </span>
                <span style={{ 
                  display: isSmallMobile ? 'none' : 'inline',
                  fontSize: 'clamp(0.65rem, 2vw, 0.8rem)'
                }}>
                  {showReturnToAdmin ? 'Admin' : 'Admin'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto" style={{ padding: '2rem 1rem' }}>
        {/* Groups Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          }}>
            Semak Progress Pembayaran Anda
          </h2>
          
          <div style={{ maxWidth: '24rem', margin: '0 auto' }}>
            <button 
              onClick={handleViewGroupsClick}
              style={{
                width: '100%',
                backgroundColor: '#16a34a',
                color: 'white',
                fontWeight: '600',
                padding: '1rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                transition: 'background-color 0.2s',
                fontSize: '1rem',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#15803d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#16a34a';
              }}
            >
              <Users size={20} />
              <span>Lihat Senarai Kumpulan</span>
            </button>
            <p style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: '0.75rem',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              Cari nama anda dalam kumpulan untuk melihat progress pembayaran
            </p>
          </div>
        </div>

        {/* Program Info */}
        <div className="grid grid-cols-1" style={{
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Calendar size={20} style={{ color: '#16a34a' }} />
                Maklumat Program
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DollarSign size={16} style={{ color: '#16a34a' }} />
                  <span style={{ color: '#4b5563' }}>Bayaran: <strong>RM100</strong> sebulan (Jumlah: RM800)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: '#2563eb' }} />
                  <span style={{ color: '#4b5563' }}>Tempoh: <strong>8 bulan</strong> (Aug 2025 - Mar 2026)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} style={{ color: '#7c3aed' }} />
                  <span style={{ color: '#4b5563' }}>Bayaran bulanan: <strong>RM100</strong></span>
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>
                Hubungi Kami
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={16} style={{ color: '#16a34a' }} />
                  <span style={{ color: '#4b5563' }}>+6014-6168216/+6016-9038867</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={16} style={{ color: '#2563eb' }} />
                  <span style={{ color: '#4b5563' }}>masjid.hangtuahsagil@gmail.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} style={{ color: '#7c3aed' }} />
                  <span style={{ color: '#4b5563' }}>Setiap hari 9 AM - 6 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '8px',
          padding: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#92400e',
            marginBottom: '0.5rem'
          }}>
            Catatan Penting
          </h3>
          <ul style={{
            color: '#92400e',
            fontSize: '0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            paddingLeft: '1rem'
          }}>
            <li>• Pembayaran perlu dijelaskan sebelum 31 Mac 2026</li>
            <li>• Setiap lembu korban mengandungi 7 bahagian</li>
            <li>• Peserta boleh membayar secara sekaligus atau ansuran</li>
            <li>• Untuk sebarang pertanyaan, hubungi pengurus masjid</li>
          </ul>
        </div>

        {/* FAQ Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          marginBottom: '2rem',
          maxWidth: '800px',
          margin: '0 auto 2rem auto'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          }}>
            <HelpCircle size={28} style={{ color: '#16a34a' }} />
            Soalan Lazim (FAQ)
          </h2>
          
          <p style={{
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '1rem',
            marginBottom: '0.5rem',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          }}>
            Program Korban Perdana - Anjuran: Masjid Al-Falah, Kampung Hang Tuah
          </p>
          
          <p style={{
            textAlign: 'center',
            color: '#4b5563',
            fontSize: '0.875rem',
            marginBottom: '2rem',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          }}>
            Berikut adalah jawapan kepada soalan-soalan yang sering ditanya mengenai Program Korban Perdana. 
            Jika ada soalan lain, sila hubungi <strong>Noor Azman bin Omar (Imam Masjid Al-Falah) di 014-6168216</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqData.map((faq, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  style={{
                    width: '100%',
                    padding: '1rem 1.5rem',
                    backgroundColor: openFaqItems[index] ? '#f0fdf4' : '#f9fafb',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left',
                    transition: 'background-color 0.2s ease',
                    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                  }}
                  onMouseEnter={(e) => {
                    if (!openFaqItems[index]) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = openFaqItems[index] ? '#f0fdf4' : '#f9fafb';
                  }}
                >
                  <span style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: openFaqItems[index] ? '#16a34a' : '#1f2937',
                    lineHeight: '1.4'
                  }}>
                    {index + 1}. {faq.question}
                  </span>
                  {openFaqItems[index] ? (
                    <ChevronUp size={20} style={{ color: '#16a34a', flexShrink: 0, marginLeft: '1rem' }} />
                  ) : (
                    <ChevronDown size={20} style={{ color: '#6b7280', flexShrink: 0, marginLeft: '1rem' }} />
                  )}
                </button>
                
                {openFaqItems[index] && (
                  <div style={{
                    padding: '1rem 1.5rem',
                    backgroundColor: '#ffffff',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <p style={{
                      color: '#4b5563',
                      fontSize: '0.95rem',
                      lineHeight: '1.6',
                      margin: 0,
                      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
                    }}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{
              color: '#166534',
              fontSize: '0.875rem',
              margin: 0,
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            }}>
              💬 <strong>Nota:</strong> Maklumat lanjut seperti borang pendaftaran dan jadual pembayaran akan dikongsi di group WhatsApp. 
              Jom sertai Program Korban Perdana dan laksanakan ibadah korban bersama-sama!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          color: '#6b7280',
          padding: '2rem 0',
          marginTop: '2rem'
        }}>
          <p style={{ fontSize: '0.875rem' }}>
            © 2025 Masjid Al-Falah Kampung Hang Tuah. Semua hak terpelihara.
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
            Untuk sebarang pertanyaan, sila hubungi pengurus masjid.
          </p>
        </div>
      </main>
    </div>
  );
};