import React, { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, X, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Group, Participant, Payment } from '../types';
import { MONTH_LABELS, KORBAN_MONTHLY_AMOUNT } from '../types';
import { createPayment } from '../utils/firestore';

interface BulkPaymentImportProps {
  participants: Participant[];
  groups: Group[];
  onImportComplete: () => void;
  onClose: () => void;
}

interface ImportRow {
  'Nama Peserta': string;
  'Kumpulan': string;
  'Bulan': string;
  'Jumlah (RM)': number;
  'Tarikh Bayar': string;
  'Status': string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  participantName: string;
  month: string;
  amount: number;
  error?: string;
}

const BulkPaymentImport: React.FC<BulkPaymentImportProps> = ({ 
  participants, 
  groups, 
  onImportComplete,
  onClose 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        'Nama Peserta': 'Ahmad bin Ali',
        'Kumpulan': 'Kumpulan A',
        'Bulan': '2025-08',
        'Jumlah (RM)': 100,
        'Tarikh Bayar': '2025-01-15',
        'Status': 'Sudah Bayar'
      },
      {
        'Nama Peserta': 'Siti binti Omar',
        'Kumpulan': 'Kumpulan B',
        'Bulan': '2025-09',
        'Jumlah (RM)': 100,
        'Tarikh Bayar': '2025-02-10',
        'Status': 'Sudah Bayar'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    ws['!cols'] = [
      { wch: 25 }, // Nama Peserta
      { wch: 15 }, // Kumpulan
      { wch: 12 }, // Bulan
      { wch: 15 }, // Jumlah (RM)
      { wch: 15 }, // Tarikh Bayar
      { wch: 15 }  // Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Import_Pembayaran.xlsx');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: ImportRow[] = XLSX.utils.sheet_to_json(worksheet);
        
        setImportData(jsonData);
        validateData(jsonData);
      } catch (error) {
        console.error('Error parsing file:', error);
        setValidationErrors([{
          row: 0,
          field: 'file',
          message: 'Gagal membaca fail. Pastikan format Excel/CSV yang betul.'
        }]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: ImportRow[]) => {
    const errors: ValidationError[] = [];
    const availableMonths = Object.keys(MONTH_LABELS);
    
    data.forEach((row, index) => {
      const rowNum = index + 2; // Excel row (1-based + header)

      // Validate participant name
      if (!row['Nama Peserta']?.trim()) {
        errors.push({
          row: rowNum,
          field: 'Nama Peserta',
          message: 'Nama peserta diperlukan'
        });
      } else {
        const participant = participants.find(p => 
          p.name.toLowerCase().trim() === row['Nama Peserta'].toLowerCase().trim()
        );
        if (!participant) {
          errors.push({
            row: rowNum,
            field: 'Nama Peserta',
            message: `Peserta '${row['Nama Peserta']}' tidak dijumpai`
          });
        }
      }

      // Validate group
      if (!row['Kumpulan']?.trim()) {
        errors.push({
          row: rowNum,
          field: 'Kumpulan',
          message: 'Kumpulan diperlukan'
        });
      } else {
        const group = groups.find(g => 
          g.name.toLowerCase().trim() === row['Kumpulan'].toLowerCase().trim()
        );
        if (!group) {
          errors.push({
            row: rowNum,
            field: 'Kumpulan',
            message: `Kumpulan '${row['Kumpulan']}' tidak dijumpai`
          });
        }
      }

      // Validate month
      if (!row['Bulan']?.trim()) {
        errors.push({
          row: rowNum,
          field: 'Bulan',
          message: 'Bulan diperlukan'
        });
      } else if (!availableMonths.includes(row['Bulan'])) {
        errors.push({
          row: rowNum,
          field: 'Bulan',
          message: `Bulan '${row['Bulan']}' tidak sah. Gunakan format: 2025-08 hingga 2026-03`
        });
      }

      // Validate amount
      const amount = Number(row['Jumlah (RM)']);
      if (!amount || amount <= 0) {
        errors.push({
          row: rowNum,
          field: 'Jumlah (RM)',
          message: 'Jumlah mesti lebih dari 0'
        });
      } else if (amount !== KORBAN_MONTHLY_AMOUNT) {
        errors.push({
          row: rowNum,
          field: 'Jumlah (RM)',
          message: `Jumlah mesti RM${KORBAN_MONTHLY_AMOUNT}`
        });
      }

      // Validate status
      if (!['Sudah Bayar', 'Belum Bayar'].includes(row['Status'])) {
        errors.push({
          row: rowNum,
          field: 'Status',
          message: 'Status mesti "Sudah Bayar" atau "Belum Bayar"'
        });
      }

      // Validate date if status is "Sudah Bayar"
      if (row['Status'] === 'Sudah Bayar') {
        if (!row['Tarikh Bayar']?.trim()) {
          errors.push({
            row: rowNum,
            field: 'Tarikh Bayar',
            message: 'Tarikh bayar diperlukan untuk status "Sudah Bayar"'
          });
        } else {
          const date = new Date(row['Tarikh Bayar']);
          if (isNaN(date.getTime())) {
            errors.push({
              row: rowNum,
              field: 'Tarikh Bayar',
              message: 'Format tarikh tidak sah. Gunakan: YYYY-MM-DD'
            });
          }
        }
      }
    });

    setValidationErrors(errors);
  };

  const processImport = async () => {
    if (validationErrors.length > 0) return;
    
    setIsProcessing(true);
    const results: ImportResult[] = [];

    for (const row of importData) {
      try {
        const participant = participants.find(p => 
          p.name.toLowerCase().trim() === row['Nama Peserta'].toLowerCase().trim()
        );
        
        if (!participant) {
          results.push({
            success: false,
            participantName: row['Nama Peserta'],
            month: row['Bulan'],
            amount: row['Jumlah (RM)'],
            error: 'Peserta tidak dijumpai'
          });
          continue;
        }

        const paymentData: Omit<Payment, 'id'> = {
          participantId: participant.id,
          month: row['Bulan'],
          amount: row['Jumlah (RM)'],
          isPaid: row['Status'] === 'Sudah Bayar',
          paidDate: row['Status'] === 'Sudah Bayar' ? new Date(row['Tarikh Bayar']) : undefined
        };

        await createPayment(paymentData);
        
        results.push({
          success: true,
          participantName: row['Nama Peserta'],
          month: row['Bulan'],
          amount: row['Jumlah (RM)']
        });
      } catch (error) {
        results.push({
          success: false,
          participantName: row['Nama Peserta'],
          month: row['Bulan'],
          amount: row['Jumlah (RM)'],
          error: error instanceof Error ? error.message : 'Ralat tidak diketahui'
        });
      }
    }

    setImportResults(results);
    setIsProcessing(false);
    setShowResults(true);
  };

  // Show results modal
  if (showResults) {
    const successCount = importResults.filter(r => r.success).length;
    const errorCount = importResults.filter(r => !r.success).length;

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
          borderRadius: '8px',
          maxWidth: '800px',
          width: '90%',
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
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              margin: 0,
              color: '#374151'
            }}>
              Hasil Import
            </h2>
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
            {/* Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <CheckCircle size={32} color="#059669" />
                <div>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#14532d',
                    margin: 0
                  }}>
                    {successCount}
                  </p>
                  <p style={{ color: '#059669', margin: 0 }}>Berjaya</p>
                </div>
              </div>
              <div style={{
                backgroundColor: '#fef2f2',
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <AlertCircle size={32} color="#dc2626" />
                <div>
                  <p style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#7f1d1d',
                    margin: 0
                  }}>
                    {errorCount}
                  </p>
                  <p style={{ color: '#dc2626', margin: 0 }}>Gagal</p>
                </div>
              </div>
            </div>

            {/* Results table */}
            <div style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              overflow: 'hidden',
              maxHeight: '400px'
            }}>
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                Detail Hasil Import
              </div>
              <div style={{ overflow: 'auto' }}>
                <table style={{
                  width: '100%',
                  fontSize: '13px',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Nama Peserta</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Bulan</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Jumlah</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Ralat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResults.map((result, index) => (
                      <tr key={index} style={{
                        backgroundColor: result.success ? '#f0fdf4' : '#fef2f2',
                        borderTop: index > 0 ? '1px solid #f3f4f6' : 'none'
                      }}>
                        <td style={{ padding: '8px 12px' }}>
                          {result.success ? (
                            <CheckCircle size={16} color="#059669" />
                          ) : (
                            <AlertCircle size={16} color="#dc2626" />
                          )}
                        </td>
                        <td style={{ padding: '8px 12px' }}>{result.participantName}</td>
                        <td style={{ padding: '8px 12px' }}>{MONTH_LABELS[result.month] || result.month}</td>
                        <td style={{ padding: '8px 12px' }}>RM{result.amount}</td>
                        <td style={{ padding: '8px 12px', color: '#dc2626' }}>{result.error || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => {
                  setShowResults(false);
                  setFile(null);
                  setImportData([]);
                  setValidationErrors([]);
                  setImportResults([]);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Import Lagi
              </button>
              <button
                onClick={() => {
                  onImportComplete();
                  onClose();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Selesai
              </button>
            </div>
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
        borderRadius: '8px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: 0,
            color: '#374151'
          }}>
            Import Pembayaran Pukal
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Step 1: Download Template */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#374151'
            }}>
              Langkah 1: Muat Turun Template
            </h3>
            <button
              onClick={downloadTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <Download size={16} />
              Muat Turun Template Excel
            </button>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '8px 0 0 0'
            }}>
              Template mengandungi format yang betul untuk import pembayaran.
            </p>
          </div>

          {/* Step 2: Upload File */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#374151'
            }}>
              Langkah 2: Pilih Fail untuk Import
            </h3>
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center',
              backgroundColor: '#f9fafb'
            }}>
              <FileSpreadsheet size={48} color="#9ca3af" style={{ margin: '0 auto 16px auto' }} />
              <div>
                <label htmlFor="file-upload" style={{
                  cursor: 'pointer',
                  color: '#059669',
                  fontWeight: '500',
                  textDecoration: 'underline'
                }}>
                  Klik untuk pilih fail Excel/CSV
                </label>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <p style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  margin: '4px 0 0 0'
                }}>
                  Excel (.xlsx, .xls) atau CSV sahaja
                </p>
              </div>
            </div>

            {file && (
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#dbeafe',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FileSpreadsheet size={20} color="#2563eb" />
                <span style={{ fontSize: '14px', color: '#1e40af' }}>
                  {file.name}
                </span>
              </div>
            )}
          </div>

          {/* Step 3: Validation Results */}
          {importData.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '12px',
                color: '#374151'
              }}>
                Langkah 3: Semak Data
              </h3>
              
              {validationErrors.length > 0 ? (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <AlertCircle size={20} color="#dc2626" style={{ marginRight: '8px' }} />
                    <h4 style={{
                      color: '#7f1d1d',
                      fontWeight: '600',
                      margin: 0
                    }}>
                      {validationErrors.length} ralat dijumpai
                    </h4>
                  </div>
                  <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {validationErrors.map((error, index) => (
                      <div key={index} style={{
                        fontSize: '14px',
                        color: '#b91c1c',
                        marginBottom: '4px'
                      }}>
                        Baris {error.row}: {error.field} - {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <CheckCircle size={20} color="#059669" style={{ marginRight: '8px' }} />
                    <h4 style={{
                      color: '#14532d',
                      fontWeight: '600',
                      margin: 0
                    }}>
                      Data sah - {importData.length} rekod siap untuk import
                    </h4>
                  </div>
                </div>
              )}

              {/* Preview data */}
              <div style={{
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '12px 16px',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  Preview Data (Menunjukkan {Math.min(5, importData.length)} daripada {importData.length} rekod)
                </div>
                <div style={{ overflow: 'auto', maxHeight: '300px' }}>
                  <table style={{
                    width: '100%',
                    fontSize: '13px',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Nama Peserta</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Kumpulan</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Bulan</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Jumlah</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 5).map((row, index) => (
                        <tr key={index} style={{
                          borderTop: index > 0 ? '1px solid #f3f4f6' : 'none'
                        }}>
                          <td style={{ padding: '8px 12px' }}>{row['Nama Peserta']}</td>
                          <td style={{ padding: '8px 12px' }}>{row['Kumpulan']}</td>
                          <td style={{ padding: '8px 12px' }}>{MONTH_LABELS[row['Bulan']] || row['Bulan']}</td>
                          <td style={{ padding: '8px 12px' }}>RM{row['Jumlah (RM)']}</td>
                          <td style={{ padding: '8px 12px' }}>{row['Status']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '13px',
              color: '#6b7280'
            }}>
              Peserta: {participants.length} | Kumpulan: {groups.length}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Batal
              </button>
              <button
                onClick={processImport}
                disabled={!file || validationErrors.length > 0 || isProcessing}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (!file || validationErrors.length > 0 || isProcessing) ? '#d1d5db' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (!file || validationErrors.length > 0 || isProcessing) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isProcessing ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Import {importData.length} Pembayaran
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkPaymentImport;