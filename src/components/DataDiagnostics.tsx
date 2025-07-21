import React, { useState } from 'react';
import { getAllParticipants, getPaymentsByMonth } from '../utils/firestore';
import { MONTHS, Payment } from '../types';
import { analyzePaymentData, generateDataReport } from '../utils/dataCleanup';
import DataCorrection from './DataCorrection';

const DataDiagnostics: React.FC = () => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'correction'>('diagnostics');

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      console.log('🔍 Starting comprehensive data analysis...');
      
      // Get all participants
      const participants = await getAllParticipants();
      console.log(`👥 Total participants: ${participants.length}`);
      
      // Get all payments for all months
      let allPayments: Payment[] = [];
      let monthlyReport = '';
      
      for (const month of MONTHS) {
        try {
          const monthPayments = await getPaymentsByMonth(month);
          allPayments = [...allPayments, ...monthPayments];
          const paidCount = monthPayments.filter(p => p.isPaid).length;
          const totalAmount = monthPayments.filter(p => p.isPaid).reduce((sum, p) => sum + (p.amount || 100), 0);
          const expectedAmount = participants.length * 100;
          
          monthlyReport += `📅 ${month}: ${monthPayments.length} total, ${paidCount} paid, RM${totalAmount} collected (expected: RM${expectedAmount})\\n`;
          
          // Log suspicious data
          if (totalAmount > expectedAmount * 1.5) {
            console.warn(`🚨 SUSPICIOUS: ${month} collected RM${totalAmount} vs expected RM${expectedAmount}`);
            monthlyReport += `   🚨 SUSPICIOUS: Amount much higher than expected!\\n`;
          }
          
          if (paidCount > participants.length) {
            console.warn(`🚨 TOO MANY PAYMENTS: ${month} has ${paidCount} paid vs ${participants.length} participants`);
            monthlyReport += `   🚨 TOO MANY PAYMENTS: More payments than participants!\\n`;
          }
          
          // Check for duplicates in this month
          const participantCounts = new Map<string, number>();
          monthPayments.filter(p => p.isPaid).forEach((payment) => {
            const count = participantCounts.get(payment.participantId) || 0;
            participantCounts.set(payment.participantId, count + 1);
          });
          
          const duplicatesInMonth = Array.from(participantCounts.entries()).filter(([, count]) => count > 1);
          if (duplicatesInMonth.length > 0) {
            console.error(`🚨 DUPLICATES in ${month}:`, duplicatesInMonth);
            monthlyReport += `   🚨 DUPLICATES: ${duplicatesInMonth.length} participants with multiple payments\\n`;
          }
          
        } catch (error) {
          console.error(`❌ Error fetching payments for ${month}:`, error);
          monthlyReport += `❌ Error fetching ${month}: ${error}\\n`;
        }
      }
      
      console.log(`💳 Total payment records: ${allPayments.length}`);
      console.log(`✅ Total paid payments: ${allPayments.filter(p => p.isPaid).length}`);
      
      // Run detailed analysis
      const detailedAnalysis = analyzePaymentData(allPayments, participants);
      const detailedReport = generateDataReport(detailedAnalysis);
      
      // Calculate overall totals
      const totalCollected = allPayments.filter(p => p.isPaid).reduce((sum, p) => sum + (p.amount || 100), 0);
      const totalExpected = participants.length * 8 * 100; // 8 months * RM100
      
      let finalReport = `=== PAYMENT DATA DIAGNOSTICS ===\\n\\n`;
      finalReport += `👥 Total participants: ${participants.length}\\n`;
      finalReport += `💳 Total payment records: ${allPayments.length}\\n`;
      finalReport += `✅ Total paid payments: ${allPayments.filter(p => p.isPaid).length}\\n\\n`;
      
      finalReport += `📊 OVERALL SUMMARY:\\n`;
      finalReport += `   Expected total: RM${totalExpected}\\n`;
      finalReport += `   Collected total: RM${totalCollected}\\n`;
      finalReport += `   Difference: RM${totalCollected - totalExpected}\\n`;
      finalReport += `   Percentage: ${totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0}%\\n\\n`;
      
      if (totalCollected > totalExpected) {
        finalReport += `🚨 PROBLEM: Collected amount exceeds expected by RM${totalCollected - totalExpected}\\n\\n`;
      }
      
      finalReport += `=== MONTHLY BREAKDOWN ===\\n`;
      finalReport += monthlyReport;
      finalReport += `\\n`;
      finalReport += detailedReport;
      
      console.log(finalReport);
      setAnalysis(finalReport);
      
    } catch (error) {
      console.error('❌ Error analyzing data:', error);
      setAnalysis(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Data Diagnostics & Correction
      </h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('diagnostics')}
          style={{
            backgroundColor: activeTab === 'diagnostics' ? '#16a34a' : '#f3f4f6',
            color: activeTab === 'diagnostics' ? 'white' : '#374151',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          📊 Diagnostics
        </button>
        <button
          onClick={() => setActiveTab('correction')}
          style={{
            backgroundColor: activeTab === 'correction' ? '#dc2626' : '#f3f4f6',
            color: activeTab === 'correction' ? 'white' : '#374151',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          🔧 Data Correction
        </button>
      </div>

      {activeTab === 'diagnostics' && (
        <>
          <button
            onClick={runDiagnostics}
            disabled={loading}
            style={{
              backgroundColor: '#16a34a',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              marginBottom: '2rem'
            }}
          >
            {loading ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
          </button>
      
          {analysis && (
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
              {analysis}
            </div>
          )}
        </>
      )}

      {activeTab === 'correction' && (
        <DataCorrection />
      )}
    </div>
  );
};

export default DataDiagnostics;