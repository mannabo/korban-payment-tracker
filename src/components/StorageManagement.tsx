import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Download, 
  Cloud, 
  AlertTriangle, 
  CheckCircle, 
  Archive,
  Trash2,
  RefreshCw,
  FileText,
  Zap
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { storageService, StorageUsage } from '../utils/storageService';
import { cloudBackupService } from '../utils/cloudBackupService';


interface BackupStatus {
  lastBackup?: Date;
  isBackingUp: boolean;
  backupError?: string;
  backupProgress?: number;
  currentFile?: string;
}

const StorageManagement: React.FC = () => {
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>({ isBackingUp: false });
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const { user } = useAuthContext();

  // Firebase Storage free tier: 5GB
  const FREE_TIER_BYTES = 5 * 1024 * 1024 * 1024; // 5GB in bytes
  const WARNING_THRESHOLD = 0.8; // 80%
  const CRITICAL_THRESHOLD = 0.95; // 95%

  useEffect(() => {
    if (user) {
      fetchStorageUsage();
    }
  }, [user]);

  const fetchStorageUsage = async () => {
    try {
      setLoading(true);
      const usage = await storageService.getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.error('Error fetching storage usage:', error);
      // Fallback to empty data if error
      setStorageUsage({
        totalSizeBytes: 0,
        totalFiles: 0,
        receiptFiles: 0,
        receiptSizeBytes: 0,
        monthlyBreakdown: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsagePercentage = (): number => {
    if (!storageUsage) return 0;
    return (storageUsage.totalSizeBytes / FREE_TIER_BYTES) * 100;
  };

  const getUsageColor = (): string => {
    const percentage = getUsagePercentage() / 100;
    if (percentage >= CRITICAL_THRESHOLD) return '#dc2626'; // Red
    if (percentage >= WARNING_THRESHOLD) return '#f59e0b'; // Amber
    return '#16a34a'; // Green
  };

  const handleMonthlyDownload = async (month: string) => {
    if (!storageUsage) return;
    
    setIsDownloading(true);
    try {
      await storageService.downloadMonthlyZip(month, (progress) => {
        console.log(`Download progress: ${progress}%`);
      });
      
      alert(`Download selesai untuk bulan ${month}`);
    } catch (error) {
      console.error('Error downloading files:', error);
      alert(`Ralat semasa download: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCloudBackup = async () => {
    setBackupStatus({ 
      isBackingUp: true, 
      backupError: undefined, 
      backupProgress: 0 
    });
    
    try {
      const result = await cloudBackupService.createFullBackup({
        includeMetadata: true,
        compressionLevel: 6,
        onProgress: (progress, currentFile) => {
          setBackupStatus(prev => ({
            ...prev,
            backupProgress: progress,
            currentFile
          }));
        }
      });
      
      if (result.success) {
        // Save to backup history
        cloudBackupService.saveBackupToHistory(result);
        
        setBackupStatus({
          isBackingUp: false,
          lastBackup: new Date(),
          backupError: undefined
        });
        
        alert(
          `Backup berjaya!\n` +
          `Files: ${result.fileCount}\n` +
          `Size: ${cloudBackupService.formatBytes(result.backupSize)}\n` +
          `Download akan bermula secara automatik.`
        );
      } else {
        throw new Error(result.error || 'Backup failed');
      }
    } catch (error) {
      console.error('Error during backup:', error);
      setBackupStatus(prev => ({
        ...prev,
        isBackingUp: false,
        backupError: error instanceof Error ? error.message : 'Backup gagal. Sila cuba lagi.'
      }));
    }
  };

  const handleCleanupOldFiles = async () => {
    const confirmed = window.confirm(
      'Adakah anda pasti ingin memadamkan resit yang ditolak dan berusia lebih dari 30 hari?'
    );
    
    if (!confirmed) return;
    
    try {
      const deletedCount = await storageService.cleanupOldRejectedReceipts(30);
      
      alert(`Cleanup selesai. ${deletedCount} files telah dipadamkan.`);
      fetchStorageUsage(); // Refresh data
    } catch (error) {
      console.error('Error during cleanup:', error);
      alert(`Ralat semasa cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!storageUsage) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Error loading storage data. Please try again.</p>
      </div>
    );
  }

  const usagePercentage = getUsagePercentage();
  const usageColor = getUsageColor();

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <HardDrive size={24} style={{ color: '#3b82f6' }} />
          Pengurusan Penyimpanan Firebase
        </h2>
        <p style={{ color: '#6b7280', fontSize: '1rem' }}>
          Monitor penggunaan storage dan backup data secara automatik
        </p>
      </div>

      {/* Storage Usage Overview */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <FileText size={20} />
          Penggunaan Storage Firebase
        </h3>

        {/* Usage Bar */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#374151' }}>
              Penggunaan Semasa
            </span>
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: usageColor 
            }}>
              {usagePercentage.toFixed(1)}%
            </span>
          </div>
          
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(usagePercentage, 100)}%`,
              height: '100%',
              backgroundColor: usageColor,
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Usage Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Jumlah Penggunaan
            </p>
            <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              {formatBytes(storageUsage.totalSizeBytes)} / {formatBytes(FREE_TIER_BYTES)}
            </p>
          </div>
          
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Jumlah Files
            </p>
            <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              {storageUsage.totalFiles.toLocaleString()}
            </p>
          </div>
          
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Resit Receipts
            </p>
            <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              {storageUsage.receiptFiles} ({formatBytes(storageUsage.receiptSizeBytes)})
            </p>
          </div>
        </div>

        {/* Warning Messages */}
        {usagePercentage >= WARNING_THRESHOLD * 100 && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            backgroundColor: usagePercentage >= CRITICAL_THRESHOLD * 100 ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${usagePercentage >= CRITICAL_THRESHOLD * 100 ? '#fecaca' : '#fed7aa'}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle 
              size={20} 
              style={{ 
                color: usagePercentage >= CRITICAL_THRESHOLD * 100 ? '#dc2626' : '#f59e0b' 
              }} 
            />
            <p style={{ 
              fontSize: '0.875rem', 
              color: usagePercentage >= CRITICAL_THRESHOLD * 100 ? '#991b1b' : '#92400e',
              margin: 0
            }}>
              {usagePercentage >= CRITICAL_THRESHOLD * 100 
                ? 'AMARAN: Penggunaan storage hampir penuh! Sila backup dan cleanup segera.'
                : 'Penggunaan storage melebihi 80%. Pertimbangkan untuk backup dan cleanup.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Monthly Download Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Archive size={20} />
          Download Backup Mengikut Bulan
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {storageUsage.monthlyBreakdown.map((monthData) => (
            <div key={monthData.month} style={{
              padding: '1rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#f9fafb'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <h4 style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>
                  {new Date(monthData.month).toLocaleDateString('ms-MY', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </h4>
                <button
                  onClick={() => handleMonthlyDownload(monthData.month)}
                  disabled={isDownloading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.375rem 0.75rem',
                    backgroundColor: isDownloading ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: isDownloading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Download size={12} />
                  ZIP
                </button>
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                margin: 0
              }}>
                {monthData.count} files • {formatBytes(monthData.sizeBytes)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Backup and Cleanup Actions */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        padding: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Zap size={20} />
          Tindakan Automatik
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {/* Cloud Backup */}
          <div style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Cloud size={20} style={{ color: '#3b82f6' }} />
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                margin: 0
              }}>
                Backup ke Google Cloud
              </h4>
            </div>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginBottom: '1rem'
            }}>
              Backup semua files ke Google Cloud Storage untuk keselamatan data
            </p>
            
            {backupStatus.lastBackup && (
              <p style={{
                fontSize: '0.75rem',
                color: '#16a34a',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <CheckCircle size={12} />
                Last backup: {backupStatus.lastBackup.toLocaleDateString('ms-MY')}
              </p>
            )}
            
            {backupStatus.backupError && (
              <p style={{
                fontSize: '0.75rem',
                color: '#dc2626',
                marginBottom: '0.5rem'
              }}>
                {backupStatus.backupError}
              </p>
            )}
            
            {backupStatus.isBackingUp && (
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.25rem'
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#374151' }}>
                    Progress
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#3b82f6' }}>
                    {Math.round(backupStatus.backupProgress || 0)}%
                  </span>
                </div>
                
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${backupStatus.backupProgress || 0}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                
                {backupStatus.currentFile && (
                  <p style={{
                    fontSize: '0.625rem',
                    color: '#6b7280',
                    marginTop: '0.25rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {backupStatus.currentFile}
                  </p>
                )}
              </div>
            )}
            
            <button
              onClick={handleCloudBackup}
              disabled={backupStatus.isBackingUp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: backupStatus.isBackingUp ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: backupStatus.isBackingUp ? 'not-allowed' : 'pointer',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              {backupStatus.isBackingUp ? (
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Cloud size={16} />
              )}
              {backupStatus.isBackingUp ? 'Backing up...' : 'Start Backup'}
            </button>
          </div>

          {/* Cleanup Old Files */}
          <div style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Trash2 size={20} style={{ color: '#f59e0b' }} />
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                margin: 0
              }}>
                Cleanup Files Lama
              </h4>
            </div>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              marginBottom: '1rem'
            }}>
              Padamkan resit yang ditolak dan berusia lebih dari 30 hari
            </p>
            
            <button
              onClick={handleCleanupOldFiles}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                cursor: 'pointer',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              <Trash2 size={16} />
              Start Cleanup
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StorageManagement;