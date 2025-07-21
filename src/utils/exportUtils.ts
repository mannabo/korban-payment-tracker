import * as XLSX from 'xlsx';
import { Group, Participant, Payment } from '../types';
import { MONTH_LABELS, KORBAN_MONTHLY_AMOUNT, getParticipantPrice } from '../types';

interface PaymentReportData {
  'Nama Peserta': string;
  'Kumpulan': string;
  'Bulan': string;
  'Status': string;
  'Jumlah (RM)': number;
  'Tarikh Bayar': string;
  'Telefon': string;
  'Email': string;
}

interface GroupSummaryData {
  'Kumpulan': string;
  'Jumlah Peserta': number;
  'Sudah Bayar': number;
  'Belum Bayar': number;
  'Peratus (%)': number;
  'Jumlah Terkumpul (RM)': number;
  'Jumlah Dijangka (RM)': number;
  'Baki (RM)': number;
}

interface MonthlySummaryData {
  'Bulan': string;
  'Jumlah Peserta': number;
  'Sudah Bayar': number;
  'Belum Bayar': number;
  'Peratus (%)': number;
  'Jumlah Terkumpul (RM)': number;
  'Jumlah Dijangka (RM)': number;
  'Baki (RM)': number;
}

export const exportPaymentReport = (
  participants: Participant[],
  groups: Group[],
  payments: Payment[],
  selectedMonth: string,
  selectedGroup: string = 'all'
) => {
  // Filter participants based on group selection
  const filteredParticipants = selectedGroup === 'all' 
    ? participants 
    : participants.filter(p => {
        const group = groups.find(g => g.id === p.groupId);
        return group?.name === selectedGroup;
      });

  // Prepare data for Excel
  const reportData: PaymentReportData[] = filteredParticipants.map(participant => {
    const group = groups.find(g => g.id === participant.groupId);
    const payment = payments.find(p => p.participantId === participant.id);
    
    return {
      'Nama Peserta': participant.name,
      'Kumpulan': group?.name || 'Unknown',
      'Bulan': MONTH_LABELS[selectedMonth] || selectedMonth,
      'Status': payment?.isPaid ? 'Sudah Bayar' : 'Belum Bayar',
      'Jumlah (RM)': getParticipantPrice(participant.sacrificeType || 'korban_sunat'),
      'Tarikh Bayar': payment?.paidDate ? payment.paidDate.toLocaleDateString('ms-MY') : '-',
      'Telefon': participant.phone || '-',
      'Email': participant.email || '-'
    };
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(reportData);

  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Nama Peserta
    { wch: 15 }, // Kumpulan
    { wch: 18 }, // Bulan
    { wch: 15 }, // Status
    { wch: 12 }, // Jumlah
    { wch: 15 }, // Tarikh Bayar
    { wch: 15 }, // Telefon
    { wch: 25 }  // Email
  ];
  ws['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Payment Report');

  // Generate filename
  const groupSuffix = selectedGroup === 'all' ? 'Semua_Kumpulan' : selectedGroup.replace(' ', '_');
  const monthSuffix = MONTH_LABELS[selectedMonth]?.replace(' ', '_') || selectedMonth;
  const filename = `Laporan_Bayaran_${groupSuffix}_${monthSuffix}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
};

export const exportGroupSummary = (
  participants: Participant[],
  groups: Group[],
  payments: Payment[],
  selectedMonth: string
) => {
  // Prepare group summary data
  const groupSummaryData: GroupSummaryData[] = groups.map(group => {
    const groupParticipants = participants.filter(p => p.groupId === group.id);
    const groupPayments = payments.filter(p => 
      groupParticipants.some(participant => participant.id === p.participantId) && p.isPaid
    );
    
    const totalParticipants = groupParticipants.length;
    const paidCount = groupPayments.length;
    const unpaidCount = totalParticipants - paidCount;
    const percentage = totalParticipants > 0 ? (paidCount / totalParticipants) * 100 : 0;
    const totalCollected = paidCount * KORBAN_MONTHLY_AMOUNT;
    const totalExpected = totalParticipants * KORBAN_MONTHLY_AMOUNT;
    const balance = totalExpected - totalCollected;
    
    return {
      'Kumpulan': group.name,
      'Jumlah Peserta': totalParticipants,
      'Sudah Bayar': paidCount,
      'Belum Bayar': unpaidCount,
      'Peratus (%)': Math.round(percentage),
      'Jumlah Terkumpul (RM)': totalCollected,
      'Jumlah Dijangka (RM)': totalExpected,
      'Baki (RM)': balance
    };
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(groupSummaryData);

  // Set column widths
  const columnWidths = [
    { wch: 15 }, // Kumpulan
    { wch: 15 }, // Jumlah Peserta
    { wch: 12 }, // Sudah Bayar
    { wch: 12 }, // Belum Bayar
    { wch: 12 }, // Peratus
    { wch: 20 }, // Jumlah Terkumpul
    { wch: 20 }, // Jumlah Dijangka
    { wch: 15 }  // Baki
  ];
  ws['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Group Summary');

  // Generate filename
  const monthSuffix = MONTH_LABELS[selectedMonth]?.replace(' ', '_') || selectedMonth;
  const filename = `Ringkasan_Kumpulan_${monthSuffix}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
};

export const exportMonthlySummary = (
  participants: Participant[],
  _groups: Group[],
  allPayments: Payment[],
  months: string[]
) => {
  // Prepare monthly summary data
  const monthlySummaryData: MonthlySummaryData[] = months.map(month => {
    const monthPayments = allPayments.filter(p => p.month === month);
    const totalParticipants = participants.length;
    const paidCount = monthPayments.filter(p => p.isPaid).length;
    const unpaidCount = totalParticipants - paidCount;
    const percentage = totalParticipants > 0 ? (paidCount / totalParticipants) * 100 : 0;
    const totalCollected = paidCount * KORBAN_MONTHLY_AMOUNT;
    const totalExpected = totalParticipants * KORBAN_MONTHLY_AMOUNT;
    const balance = totalExpected - totalCollected;
    
    return {
      'Bulan': MONTH_LABELS[month] || month,
      'Jumlah Peserta': totalParticipants,
      'Sudah Bayar': paidCount,
      'Belum Bayar': unpaidCount,
      'Peratus (%)': Math.round(percentage),
      'Jumlah Terkumpul (RM)': totalCollected,
      'Jumlah Dijangka (RM)': totalExpected,
      'Baki (RM)': balance
    };
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(monthlySummaryData);

  // Set column widths
  const columnWidths = [
    { wch: 18 }, // Bulan
    { wch: 15 }, // Jumlah Peserta
    { wch: 12 }, // Sudah Bayar
    { wch: 12 }, // Belum Bayar
    { wch: 12 }, // Peratus
    { wch: 20 }, // Jumlah Terkumpul
    { wch: 20 }, // Jumlah Dijangka
    { wch: 15 }  // Baki
  ];
  ws['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Monthly Summary');

  // Generate filename
  const filename = `Ringkasan_Bulanan_Korban_2025-2026.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
};

export const exportDetailedReport = (
  participants: Participant[],
  groups: Group[],
  allPayments: Payment[],
  months: string[]
) => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // 1. Payment Details Sheet
  const paymentDetailsData: PaymentReportData[] = [];
  months.forEach(month => {
    const monthPayments = allPayments.filter(p => p.month === month);
    participants.forEach(participant => {
      const group = groups.find(g => g.id === participant.groupId);
      const payment = monthPayments.find(p => p.participantId === participant.id);
      
      paymentDetailsData.push({
        'Nama Peserta': participant.name,
        'Kumpulan': group?.name || 'Unknown',
        'Bulan': MONTH_LABELS[month] || month,
        'Status': payment?.isPaid ? 'Sudah Bayar' : 'Belum Bayar',
        'Jumlah (RM)': getParticipantPrice(participant.sacrificeType || 'korban_sunat'),
        'Tarikh Bayar': payment?.paidDate ? payment.paidDate.toLocaleDateString('ms-MY') : '-',
        'Telefon': participant.phone || '-',
        'Email': participant.email || '-'
      });
    });
  });

  const paymentWs = XLSX.utils.json_to_sheet(paymentDetailsData);
  paymentWs['!cols'] = [
    { wch: 25 }, { wch: 15 }, { wch: 18 }, { wch: 15 },
    { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, paymentWs, 'Payment Details');

  // 2. Group Summary Sheet
  const groupSummaryData: GroupSummaryData[] = groups.map(group => {
    const groupParticipants = participants.filter(p => p.groupId === group.id);
    const groupPayments = allPayments.filter(p => 
      groupParticipants.some(participant => participant.id === p.participantId) && p.isPaid
    );
    
    const totalParticipants = groupParticipants.length;
    const paidCount = groupPayments.length;
    const totalExpected = totalParticipants * KORBAN_MONTHLY_AMOUNT * months.length;
    const totalCollected = groupPayments.length * KORBAN_MONTHLY_AMOUNT;
    const percentage = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    
    return {
      'Kumpulan': group.name,
      'Jumlah Peserta': totalParticipants,
      'Sudah Bayar': paidCount,
      'Belum Bayar': (totalParticipants * months.length) - paidCount,
      'Peratus (%)': Math.round(percentage),
      'Jumlah Terkumpul (RM)': totalCollected,
      'Jumlah Dijangka (RM)': totalExpected,
      'Baki (RM)': totalExpected - totalCollected
    };
  });

  const groupWs = XLSX.utils.json_to_sheet(groupSummaryData);
  groupWs['!cols'] = [
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, groupWs, 'Group Summary');

  // 3. Monthly Summary Sheet
  const monthlySummaryData: MonthlySummaryData[] = months.map(month => {
    const monthPayments = allPayments.filter(p => p.month === month);
    const totalParticipants = participants.length;
    const paidCount = monthPayments.filter(p => p.isPaid).length;
    const totalExpected = totalParticipants * KORBAN_MONTHLY_AMOUNT;
    const totalCollected = paidCount * KORBAN_MONTHLY_AMOUNT;
    const percentage = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    
    return {
      'Bulan': MONTH_LABELS[month] || month,
      'Jumlah Peserta': totalParticipants,
      'Sudah Bayar': paidCount,
      'Belum Bayar': totalParticipants - paidCount,
      'Peratus (%)': Math.round(percentage),
      'Jumlah Terkumpul (RM)': totalCollected,
      'Jumlah Dijangka (RM)': totalExpected,
      'Baki (RM)': totalExpected - totalCollected
    };
  });

  const monthlyWs = XLSX.utils.json_to_sheet(monthlySummaryData);
  monthlyWs['!cols'] = [
    { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 15 }
  ];
  XLSX.utils.book_append_sheet(wb, monthlyWs, 'Monthly Summary');

  // Generate filename
  const filename = `Laporan_Lengkap_Korban_2025-2026.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
};