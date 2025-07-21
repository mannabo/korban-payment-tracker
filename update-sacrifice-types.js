/**
 * Script to update existing participants with default sacrifice type
 * Run this script once after implementing the new sacrifice type feature
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function updateParticipantsWithSacrificeType() {
  try {
    console.log('🔄 Starting to update participants with sacrifice type...');
    
    // Get all participants
    const participantsSnapshot = await getDocs(collection(db, 'participants'));
    const participants = participantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Found ${participants.length} participants to update`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Update each participant
    for (const participant of participants) {
      try {
        // Check if participant already has sacrificeType
        if (participant.sacrificeType) {
          console.log(`⏭️  Skipping ${participant.name} - already has sacrifice type: ${participant.sacrificeType}`);
          skippedCount++;
          continue;
        }
        
        // Update participant with default sacrifice type
        const participantRef = doc(db, 'participants', participant.id);
        await updateDoc(participantRef, {
          sacrificeType: 'korban_sunat'  // Default to korban sunat
        });
        
        console.log(`✅ Updated ${participant.name} with default sacrifice type: korban_sunat`);
        updatedCount++;
        
        // Add small delay to avoid overwhelming Firestore
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error updating participant ${participant.name}:`, error);
      }
    }
    
    console.log('\n📋 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} participants`);
    console.log(`⏭️  Skipped (already had type): ${skippedCount} participants`);
    console.log(`📊 Total processed: ${participants.length} participants`);
    
    if (updatedCount > 0) {
      console.log('\n🎉 All participants now have sacrifice types!');
      console.log('📝 Note: All updated participants defaulted to "korban_sunat"');
      console.log('👥 Participants can now change their sacrifice type through the edit form');
    }
    
  } catch (error) {
    console.error('💥 Error during update process:', error);
  }
}

// Run the update
updateParticipantsWithSacrificeType()
  .then(() => {
    console.log('\n🏁 Update process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Update process failed:', error);
    process.exit(1);
  });