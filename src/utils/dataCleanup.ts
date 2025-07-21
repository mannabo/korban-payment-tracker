import { Payment, Participant } from '../types';
import { deletePayment } from './firestore';

export interface DataAnalysis {
  duplicates: Array<{
    participantId: string;
    month: string;
    payments: Payment[];
  }>;
  suspiciousAmounts: Payment[];
  orphanedPayments: Payment[];
  totalIssues: number;
}

export const analyzePaymentData = (
  payments: Payment[], 
  participants: Participant[]
): DataAnalysis => {
  const duplicates: Array<{
    participantId: string;
    month: string;
    payments: Payment[];
  }> = [];
  
  const suspiciousAmounts: Payment[] = [];
  const orphanedPayments: Payment[] = [];
  
  // Check for duplicates
  const paymentMap = new Map<string, Payment[]>();
  
  payments.forEach(payment => {
    const key = `${payment.participantId}-${payment.month}`;
    if (!paymentMap.has(key)) {
      paymentMap.set(key, []);
    }
    paymentMap.get(key)!.push(payment);
  });
  
  paymentMap.forEach((paymentList, key) => {
    if (paymentList.length > 1) {
      const [participantId, month] = key.split('-');
      duplicates.push({
        participantId,
        month,
        payments: paymentList
      });
    }
  });
  
  // Check for suspicious amounts (not RM100)
  payments.forEach(payment => {
    if (payment.amount !== 100) {
      suspiciousAmounts.push(payment);
    }
  });
  
  // Check for orphaned payments (no matching participant)
  const participantIds = new Set(participants.map(p => p.id));
  payments.forEach(payment => {
    if (!participantIds.has(payment.participantId)) {
      orphanedPayments.push(payment);
    }
  });
  
  return {
    duplicates,
    suspiciousAmounts,
    orphanedPayments,
    totalIssues: duplicates.length + suspiciousAmounts.length + orphanedPayments.length
  };
};

export const cleanupDuplicatePayments = async (duplicates: Array<{
  participantId: string;
  month: string;
  payments: Payment[];
}>): Promise<number> => {
  let cleanedCount = 0;
  
  for (const duplicate of duplicates) {
    // Keep the first payment, delete the rest
    const paymentsToDelete = duplicate.payments.slice(1);
    
    for (const payment of paymentsToDelete) {
      try {
        await deletePayment(payment.id);
        cleanedCount++;
        console.log(`Deleted duplicate payment: ${payment.id} for participant ${duplicate.participantId} month ${duplicate.month}`);
      } catch (error) {
        console.error(`Failed to delete payment ${payment.id}:`, error);
      }
    }
  }
  
  return cleanedCount;
};

export const generateDataReport = (analysis: DataAnalysis): string => {
  let report = '=== DATA ANALYSIS REPORT ===\n\n';
  
  report += `Total Issues Found: ${analysis.totalIssues}\n\n`;
  
  if (analysis.duplicates.length > 0) {
    report += `🔄 DUPLICATE PAYMENTS: ${analysis.duplicates.length}\n`;
    analysis.duplicates.forEach(dup => {
      report += `  - Participant ${dup.participantId}, Month ${dup.month}: ${dup.payments.length} payments\n`;
    });
    report += '\n';
  }
  
  if (analysis.suspiciousAmounts.length > 0) {
    report += `💰 SUSPICIOUS AMOUNTS: ${analysis.suspiciousAmounts.length}\n`;
    analysis.suspiciousAmounts.forEach(payment => {
      report += `  - Payment ${payment.id}: RM${payment.amount} (expected RM100)\n`;
    });
    report += '\n';
  }
  
  if (analysis.orphanedPayments.length > 0) {
    report += `👻 ORPHANED PAYMENTS: ${analysis.orphanedPayments.length}\n`;
    analysis.orphanedPayments.forEach(payment => {
      report += `  - Payment ${payment.id}: Participant ${payment.participantId} not found\n`;
    });
    report += '\n';
  }
  
  if (analysis.totalIssues === 0) {
    report += '✅ No data issues detected!';
  }
  
  return report;
};