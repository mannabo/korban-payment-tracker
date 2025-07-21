import React, { useState } from 'react';
import { getAllParticipants, getPaymentsByMonth, updatePayment } from '../utils/firestore';
import { MONTHS, Payment } from '../types';

const DataCorrection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState('');

  const fixSuspiciousAmounts = async () => {
    setLoading(true);
    setProgress('Starting correction process...');
    setResults('');

    try {
      // Get all payments across all months
      let allSuspiciousPayments: Payment[] = [];
      let correctionReport = '=== PAYMENT CORRECTION REPORT ===\n\n';

      for (const month of MONTHS) {
        setProgress(`Scanning ${month}...`);
        
        try {
          const monthPayments = await getPaymentsByMonth(month);
          const suspiciousPayments = monthPayments.filter(p => p.amount !== 100);
          
          if (suspiciousPayments.length > 0) {
            correctionReport += `📅 ${month}: Found ${suspiciousPayments.length} payments with incorrect amounts\n`;
            allSuspiciousPayments = [...allSuspiciousPayments, ...suspiciousPayments];
            
            // Log details
            suspiciousPayments.forEach(payment => {
              correctionReport += `   - Payment ${payment.id}: RM${payment.amount} → RM100\n`;
            });
          } else {
            correctionReport += `📅 ${month}: No corrections needed\n`;
          }
        } catch (error) {
          console.error(`Error processing ${month}:`, error);
          correctionReport += `❌ ${month}: Error - ${error}\n`;
        }
      }

      correctionReport += `\n🔧 Total payments to correct: ${allSuspiciousPayments.length}\n\n`;
      
      if (allSuspiciousPayments.length === 0) {
        setResults(correctionReport + '✅ No payments need correction!');
        setLoading(false);
        return;
      }

      // Ask for confirmation
      const confirmed = window.confirm(
        `Found ${allSuspiciousPayments.length} payments with incorrect amounts.\n\n` +
        'This will correct all payments from RM800 to RM100.\n\n' +
        'This action cannot be undone. Continue?'
      );

      if (!confirmed) {
        setResults(correctionReport + '❌ Correction cancelled by user.');
        setLoading(false);
        return;
      }

      // Perform corrections
      let correctedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < allSuspiciousPayments.length; i++) {
        const payment = allSuspiciousPayments[i];
        setProgress(`Correcting payment ${i + 1}/${allSuspiciousPayments.length}: ${payment.id}`);

        try {
          await updatePayment(payment.id, { amount: 100 });
          correctedCount++;
          console.log(`✅ Corrected payment ${payment.id}: RM${payment.amount} → RM100`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Failed to correct payment ${payment.id}:`, error);
          correctionReport += `❌ Failed to correct ${payment.id}: ${error}\n`;
        }

        // Small delay to avoid rate limiting
        if (i % 10 === 0 && i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      correctionReport += `\n=== CORRECTION RESULTS ===\n`;
      correctionReport += `✅ Successfully corrected: ${correctedCount} payments\n`;
      correctionReport += `❌ Failed corrections: ${errorCount} payments\n`;
      correctionReport += `📊 Success rate: ${Math.round((correctedCount / allSuspiciousPayments.length) * 100)}%\n\n`;

      if (correctedCount > 0) {
        correctionReport += `🎉 Correction complete! Please refresh the dashboard to see updated calculations.\n`;
      }

      setResults(correctionReport);
      setProgress('Correction complete!');

    } catch (error) {
      console.error('❌ Error during correction:', error);
      setResults(`❌ Error during correction: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrentImpact = async () => {
    setLoading(true);
    setProgress('Calculating impact...');

    try {
      const participants = await getAllParticipants();
      let totalCorrect = 0;
      let totalIncorrect = 0;
      let impactReport = '=== CURRENT IMPACT ANALYSIS ===\n\n';

      for (const month of MONTHS) {
        const monthPayments = await getPaymentsByMonth(month);
        const paidPayments = monthPayments.filter(p => p.isPaid);
        const correctPayments = paidPayments.filter(p => p.amount === 100);
        const incorrectPayments = paidPayments.filter(p => p.amount !== 100);
        
        const correctAmount = correctPayments.reduce((sum, p) => sum + p.amount, 0);
        const incorrectAmount = incorrectPayments.reduce((sum, p) => sum + p.amount, 0);
        
        totalCorrect += correctAmount;
        totalIncorrect += incorrectAmount;
        
        if (incorrectPayments.length > 0) {
          impactReport += `📅 ${month}: RM${incorrectAmount} excess (${incorrectPayments.length} payments)\n`;
        }
      }

      const expectedTotal = participants.length * 8 * 100; // 8 months × RM100
      const currentTotal = totalCorrect + totalIncorrect;
      const excessAmount = totalIncorrect;

      impactReport += `\n📊 SUMMARY:\n`;
      impactReport += `   Participants: ${participants.length}\n`;
      impactReport += `   Expected total: RM${expectedTotal}\n`;
      impactReport += `   Current total: RM${currentTotal}\n`;
      impactReport += `   Correct payments: RM${totalCorrect}\n`;
      impactReport += `   Excess from errors: RM${excessAmount}\n`;
      impactReport += `   After correction: RM${totalCorrect + (totalIncorrect / 8)}\n\n`;

      if (excessAmount > 0) {
        impactReport += `🚨 IMPACT: Dashboard shows RM${excessAmount} excess due to incorrect amounts\n`;
        impactReport += `✅ After correction: Will reduce by RM${excessAmount - (totalIncorrect / 8)}\n`;
      }

      setResults(impactReport);
    } catch (error) {
      setResults(`❌ Error calculating impact: ${error}`);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#dc2626' }}>
        🔧 Data Correction Tool
      </h1>
      
      <div style={{ 
        backgroundColor: '#fef2f2', 
        border: '1px solid #fecaca', 
        borderRadius: '8px', 
        padding: '1rem', 
        marginBottom: '2rem' 
      }}>
        <h3 style={{ color: '#dc2626', fontWeight: '600', marginBottom: '0.5rem' }}>
          ⚠️ WARNING: Data Correction Required
        </h3>
        <p style={{ color: '#7f1d1d', fontSize: '0.875rem' }}>
          Detected payments with RM800 amounts instead of RM100. This is causing calculation errors.
          Use the tools below to analyze and fix the data.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={calculateCurrentImpact}
          disabled={loading}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '8px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Current Impact'}
        </button>
        
        <button
          onClick={fixSuspiciousAmounts}
          disabled={loading}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '8px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          {loading ? 'Correcting...' : 'Fix All RM800 → RM100'}
        </button>
      </div>

      {progress && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <p style={{ color: '#1e40af', fontWeight: '500' }}>
            🔄 {progress}
          </p>
        </div>
      )}

      {results && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '2rem',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          whiteSpace: 'pre-wrap',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          {results}
        </div>
      )}
    </div>
  );
};

export default DataCorrection;