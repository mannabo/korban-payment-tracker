import { enableNetwork } from 'firebase/firestore';
import { db } from './firebase';
import { getAllParticipants, getGroups } from './firestore';

export const testFirebaseConnection = async () => {
  console.log('🔍 Testing Firebase connection...');
  
  try {
    // Test basic Firestore connectivity
    console.log('📡 Testing Firestore connectivity...');
    
    // Try to enable network (this will throw if there are connection issues)
    await enableNetwork(db);
    console.log('✅ Firestore network enabled successfully');
    
    // Test reading groups
    console.log('📊 Testing groups collection...');
    const groups = await getGroups();
    console.log(`✅ Found ${groups.length} groups:`, groups.map(g => g.name));
    
    // Test reading participants
    console.log('👥 Testing participants collection...');
    const participants = await getAllParticipants();
    console.log(`✅ Found ${participants.length} participants`);
    
    if (participants.length > 0) {
      console.log('👤 Sample participants:', participants.slice(0, 3).map(p => p.name));
    }
    
    console.log('🎉 Firebase connection test completed successfully!');
    return {
      success: true,
      groupsCount: groups.length,
      participantsCount: participants.length,
      groups: groups,
      participants: participants
    };
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    console.log('🔧 Possible solutions:');
    console.log('   1. Check internet connection');
    console.log('   2. Verify Firebase project settings');
    console.log('   3. Check Firestore security rules');
    console.log('   4. Ensure Firebase project is active');
    
    return {
      success: false,
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Diagnostic function to check Firebase configuration
export const diagnoseFirebaseConfig = () => {
  console.log('🔍 Firebase Configuration Diagnostic');
  console.log('====================================');
  
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB8N6hU7V9CC636W_mrYWzLVY0h6ldO5ro",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "korban-payment-tracker.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "korban-payment-tracker",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "korban-payment-tracker.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "48800151000",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:48800151000:web:6f9c50f2ef60ec0835eead"
  };
  
  console.log('🔧 Project ID:', config.projectId);
  console.log('🌐 Auth Domain:', config.authDomain);
  console.log('🔑 API Key:', config.apiKey ? 'Configured ✓' : 'Missing ❌');
  console.log('📦 Storage Bucket:', config.storageBucket);
  console.log('📨 Messaging Sender ID:', config.messagingSenderId);
  console.log('🆔 App ID:', config.appId ? 'Configured ✓' : 'Missing ❌');
  
  // Check environment variables
  console.log('🌍 Environment Variables:');
  console.log('   VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Set ✓' : 'Using default ⚠️');
  console.log('   VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Set ✓' : 'Using default ⚠️');
  
  return config;
};

// Function to debug specific participant payment data
export const debugParticipantPayments = async (participantName: string) => {
  console.log(`🔍 Debugging payments for: ${participantName}`);
  
  try {
    const { getAllParticipants, getPaymentsByParticipant } = await import('./firestore');
    
    // Find participant by name
    const participants = await getAllParticipants();
    const participant = participants.find(p => p.name.toLowerCase().includes(participantName.toLowerCase()));
    
    if (!participant) {
      console.log(`❌ Participant "${participantName}" not found`);
      console.log('Available participants:', participants.map(p => p.name));
      return;
    }
    
    console.log(`✅ Found participant:`, participant);
    
    // Get payments
    const payments = await getPaymentsByParticipant(participant.id);
    console.log(`💳 Total payments: ${payments.length}`);
    
    if (payments.length > 0) {
      console.log('Payment details:');
      payments.forEach((payment, index) => {
        console.log(`  ${index + 1}. Month: ${payment.month}, Paid: ${payment.isPaid}, Amount: ${payment.amount}`);
      });
      
      // Show expected sequence
      const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
      const paidPayments = payments.filter(p => p.isPaid).sort((a, b) => a.month.localeCompare(b.month));
      
      console.log('Expected sequential progress:');
      months.forEach((month, index) => {
        const shouldBeFilled = index < paidPayments.length;
        console.log(`  ${month}: ${shouldBeFilled ? '✅ FILLED' : '❌ empty'}`);
      });
    } else {
      console.log('❌ No payments found for this participant');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
};

// Function to create sample data for testing
export const createSampleData = async () => {
  console.log('🛠️ Creating sample data for testing...');
  
  try {
    const { createGroup, createParticipant, createPayment } = await import('./firestore');
    
    // Create sample groups
    const group1Id = await createGroup({
      name: 'Kumpulan 1',
      participants: []
    });
    
    console.log('✅ Created group:', group1Id);
    
    // Create sample participant
    const participantId = await createParticipant({
      name: 'Ahmad Test',
      email: 'ahmad.test@email.com',
      phone: '012-3456789',
      groupId: group1Id,
      sacrificeType: 'korban_sunat'
    });
    
    console.log('✅ Created participant:', participantId);
    
    // Create sample payment
    const paymentId = await createPayment({
      participantId: participantId,
      month: '2025-08',
      amount: 100,
      isPaid: true,
      paidDate: new Date()
    });
    
    console.log('✅ Created payment:', paymentId);
    console.log('🎉 Sample data created successfully!');
    
    return { group1Id, participantId, paymentId };
    
  } catch (error) {
    console.error('❌ Failed to create sample data:', error);
    throw error;
  }
};
