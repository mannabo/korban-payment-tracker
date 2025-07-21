// Script untuk tambah payment records untuk demo participants
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB8N6hU7V9CC636W_mrYWzLVY0h6ldO5ro",
  authDomain: "korban-payment-tracker.firebaseapp.com",
  projectId: "korban-payment-tracker",
  storageBucket: "korban-payment-tracker.firebasestorage.app",
  messagingSenderId: "48800151000",
  appId: "1:48800151000:web:6f9c50f2ef60ec0835eead"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addPaymentData() {
  try {
    console.log('🚀 Mengambil semua participants...');
    
    // Get semua participants dari Firebase
    const participantsSnapshot = await getDocs(collection(db, 'participants'));
    const participants = participantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Jumpa ${participants.length} participants`);
    
    // 8 bulan payment schedule
    const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
    const monthNames = ['Ogos 2025', 'September 2025', 'Oktober 2025', 'November 2025', 'Disember 2025', 'Januari 2026', 'Februari 2026', 'Mac 2026'];
    
    console.log('🚀 Menambah payment records...');
    
    for (const participant of participants) {
      console.log(`📝 Processing payments untuk: ${participant.name}`);
      
      // Create random but realistic payment pattern
      const paidMonths = Math.floor(Math.random() * 6) + 1; // 1-6 bulan sudah bayar
      
      for (let i = 0; i < months.length; i++) {
        const month = months[i];
        const monthName = monthNames[i];
        const isPaid = i < paidMonths; // Bayar secara berturut-turut dari bulan pertama
        
        const paymentRecord = {
          participantId: participant.id,
          month: month,
          monthName: monthName,
          amount: 100, // RM100 per bulan
          isPaid: isPaid,
          paidDate: isPaid ? new Date(2025, 7 + i, Math.floor(Math.random() * 28) + 1) : null, // Random date dalam bulan tu
          paymentMethod: isPaid ? (Math.random() > 0.5 ? 'Cash' : 'Online Transfer') : null,
          notes: isPaid ? 'Pembayaran diterima' : null
        };
        
        try {
          const docRef = await addDoc(collection(db, 'payments'), paymentRecord);
          if (isPaid) {
            console.log(`  ✅ ${monthName}: PAID (${docRef.id})`);
          } else {
            console.log(`  ⏳ ${monthName}: PENDING (${docRef.id})`);
          }
        } catch (error) {
          console.error(`  ❌ Error adding payment for ${monthName}:`, error);
        }
      }
      
      console.log(`📊 ${participant.name}: ${paidMonths}/8 bulan paid\n`);
    }
    
    console.log('🎉 Payment data berjaya ditambah!');
    
  } catch (error) {
    console.error('❌ Error adding payment data:', error);
  }
}

addPaymentData();