import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, CheckCircle, AlertCircle, Camera, FileText } from 'lucide-react';
import { MONTH_LABELS, KORBAN_MONTHLY_AMOUNT } from '../types';
import ReceiptService from '../utils/receiptService';
import UploadTroubleshooting from './UploadTroubleshooting';

interface ReceiptUploadProps {
  participantId: string;
  participantName: string;
  month: string;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  participantId,
  participantName,
  month,
  onClose,
  onUploadSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState(KORBAN_MONTHLY_AMOUNT);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const receiptService = ReceiptService.getInstance();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = receiptService.validateReceiptFile(file);
    if (!validation.valid) {
      setError(validation.error || 'File tidak valid');
      return;
    }

    // Validate file content
    const contentValidation = await receiptService.validateFileContent(file);
    if (!contentValidation.valid) {
      setError(contentValidation.error || 'File tidak valid');
      return;
    }

    setSelectedFile(file);

    // Create preview
    if (file.type === 'application/pdf') {
      // For PDF, create a thumbnail using the service
      const thumbnail = await receiptService.createThumbnail(file);
      setPreview(thumbnail);
    } else {
      // For images, use FileReader
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Show intermediate progress
      setUploadProgress(10);
      
      // Upload file
      const fileUrl = await receiptService.uploadReceiptFile(
        participantId,
        month,
        selectedFile
      );
      
      setUploadProgress(70);

      // Submit for approval
      await receiptService.submitReceiptForApproval({
        participantId,
        month,
        amount,
        receiptImageUrl: fileUrl,
        notes: notes.trim() || undefined
      }, selectedFile);

      setUploadProgress(100);
      setSuccess(true);
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Show specific error messages based on the error type
      if (error instanceof Error) {
        if (error.message.includes('Ralat kebenaran')) {
          setError('Ralat kebenaran: Sila semak sambungan internet dan cuba lagi.');
        } else if (error.message.includes('CORS') || error.message.includes('Ralat sambungan')) {
          setError('Sambungan terputus. Sila:\n1. Semak sambungan internet\n2. Refresh page dan log masuk semula\n3. Cuba upload file yang lebih kecil (<2MB)');
        } else {
          setError(error.message);
        }
      } else {
        setError('Gagal memuat naik resit. Sila cuba lagi.');
      }
      
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (success) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center'
        }}>
          <CheckCircle size={64} color="#059669" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ color: '#374151', marginBottom: '8px' }}>Resit Berjaya Dihantar!</h3>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            Resit anda telah dihantar untuk semakan admin. Anda akan dimaklumkan setelah disahkan.
          </p>
          <div style={{
            backgroundColor: '#f0fdf4',
            padding: '12px',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#059669'
          }}>
            Status: <strong>Menunggu Kelulusan</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .upload-area {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 32px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            background-color: #f9fafb;
          }
          .upload-area:hover {
            border-color: #2563eb;
            background-color: #eff6ff;
          }
          .upload-area.dragover {
            border-color: #2563eb;
            background-color: #dbeafe;
          }
        `}
      </style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}>
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Camera size={24} color="#2563eb" />
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                margin: 0,
                color: '#374151'
              }}>
                Muat Naik Resit Pembayaran
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              <X size={20} color="#6b7280" />
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Payment Info */}
            <div style={{
              backgroundColor: '#f0fdf4',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#14532d' }}>Maklumat Pembayaran</h3>
              <div style={{ fontSize: '14px', color: '#059669' }}>
                <p style={{ margin: '4px 0' }}><strong>Nama:</strong> {participantName}</p>
                <p style={{ margin: '4px 0' }}><strong>Bulan:</strong> {MONTH_LABELS[month] || month}</p>
                <p style={{ margin: '4px 0' }}><strong>Jumlah:</strong> RM{amount}</p>
              </div>
            </div>

            {/* Amount Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Jumlah Bayaran (RM)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={1}
                max={1000}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
                placeholder="Masukkan jumlah pembayaran"
              />
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                margin: '4px 0 0 0'
              }}>
                Jumlah standard: RM{KORBAN_MONTHLY_AMOUNT}
              </p>
            </div>

            {/* File Upload Area */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Resit Pembayaran
              </label>
              
              {!selectedFile ? (
                <div 
                  className="upload-area"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                    <ImageIcon size={48} color="#9ca3af" />
                    <FileText size={48} color="#9ca3af" />
                  </div>
                  <h4 style={{ color: '#374151', marginBottom: '8px' }}>
                    Klik untuk pilih resit (gambar atau PDF)
                  </h4>
                  <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                    Format: JPEG, PNG, WebP (maks 5MB) atau PDF (maks 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'relative',
                    backgroundColor: '#f9fafb'
                  }}>
                    {preview && (
                      selectedFile?.type === 'application/pdf' ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '200px',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <img
                            src={preview}
                            alt="PDF icon"
                            style={{ width: '64px', height: '64px' }}
                          />
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, color: '#374151', fontWeight: '600' }}>PDF Resit</p>
                            <p style={{ margin: '4px 0', color: '#6b7280', fontSize: '14px' }}>{selectedFile.name}</p>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={preview}
                          alt="Preview resit"
                          style={{
                            width: '100%',
                            maxHeight: '300px',
                            objectFit: 'contain'
                          }}
                        />
                      )
                    )}
                    <button
                      onClick={clearFile}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div style={{
                    padding: '12px',
                    backgroundColor: 'white',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                      <strong>{selectedFile.name}</strong>
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                      {receiptService.formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#374151'
              }}>
                Catatan (Pilihan)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
                placeholder="Catatan tambahan (contoh: bayaran sebahagian, lewat, dll.)"
              />
            </div>

            {/* Error Message */}
            {error && (
              <>
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={20} color="#dc2626" />
                  <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
                </div>
                
                {/* Show troubleshooting if error contains CORS or connection issues */}
                {(error.includes('CORS') || error.includes('sambungan') || error.includes('kebenaran')) && (
                  <UploadTroubleshooting />
                )}
              </>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #93c5fd',
                    borderTop: '2px solid #2563eb',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span style={{ color: '#2563eb', fontSize: '14px' }}>
                    Memuat naik resit...
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
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: '#2563eb',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <button
                onClick={onClose}
                disabled={uploading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  flex: 1
                }}
              >
                Batal
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading || amount <= 0}
                style={{
                  padding: '12px 24px',
                  backgroundColor: (!selectedFile || uploading || amount <= 0) ? '#d1d5db' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!selectedFile || uploading || amount <= 0) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                  flex: 2
                }}
              >
                {uploading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Memuat naik...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Hantar Resit
                  </>
                )}
              </button>
            </div>

            {/* Info */}
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#eff6ff',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#1e40af'
            }}>
              💡 <strong>Panduan:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Pastikan resit jelas dan mudah dibaca</li>
                <li>Nama penerima dan jumlah mesti kelihatan</li>
                <li>Admin akan semak dalam masa 1-2 hari bekerja</li>
                <li>Anda akan dimaklumkan melalui sistem setelah disahkan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptUpload;