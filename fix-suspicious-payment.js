const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "korban-payment-tracker",
      // Add your service account key details here if needed
    })
  });
}

const db = admin.firestore();

async function fixSuspiciousPayment() {
  console.log('🔧 Fixing suspicious payment amount...');
  
  const paymentId = 'OqK0tVFNkqISC3bAi14N';
  
  try {
    // Get the payment document
    const paymentRef = db.collection('payments').doc(paymentId);
    const paymentDoc = await paymentRef.get();
    
    if (!paymentDoc.exists) {
      console.log('❌ Payment not found:', paymentId);
      return;
    }
    
    const paymentData = paymentDoc.data();
    console.log('📄 Current payment data:', paymentData);
    
    // Update amount to RM100
    await paymentRef.update({
      amount: 100,
      notes: paymentData.notes ? `${paymentData.notes} (corrected from RM200)` : 'Amount corrected from RM200 to RM100'
    });
    
    console.log('✅ Successfully corrected payment amount from RM200 to RM100');
    console.log('📋 Payment ID:', paymentId);
    
  } catch (error) {
    console.error('❌ Error fixing payment:', error);
  }
}

// Run the fix
fixSuspiciousPayment()
  .then(() => {
    console.log('🎉 Payment correction completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });