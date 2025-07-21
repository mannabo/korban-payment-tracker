// Data Investigation Script for Korban Payment Tracker
// This script investigates the data discrepancy reported by the user

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

async function investigateData() {
  console.log('🔍 Starting data investigation...\n');
  
  try {
    // 1. Count groups
    console.log('1. Counting groups...');
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    const groups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`   Total groups: ${groups.length}`);
    
    // 2. Count all participants
    console.log('\n2. Counting all participants...');
    const participantsSnapshot = await getDocs(collection(db, 'participants'));
    const allParticipants = participantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`   Total participants: ${allParticipants.length}`);
    
    // 3. For each group, count participants
    console.log('\n3. Participants per group:');
    const groupParticipantCounts = {};
    let totalParticipantsInGroups = 0;
    
    for (const group of groups) {
      const participantsInGroup = allParticipants.filter(p => p.groupId === group.id);
      groupParticipantCounts[group.id] = participantsInGroup.length;
      totalParticipantsInGroups += participantsInGroup.length;
      console.log(`   Group "${group.name}" (${group.id}): ${participantsInGroup.length} participants`);
    }
    
    console.log(`   Total participants counted in groups: ${totalParticipantsInGroups}`);
    
    // 4. Check for orphaned participants
    console.log('\n4. Checking for orphaned participants...');
    const groupIds = new Set(groups.map(g => g.id));
    const orphanedParticipants = allParticipants.filter(p => !groupIds.has(p.groupId));
    
    if (orphanedParticipants.length > 0) {
      console.log(`   Found ${orphanedParticipants.length} orphaned participants:`);
      orphanedParticipants.forEach(p => {
        console.log(`   - ${p.name} (ID: ${p.id}, Invalid groupId: ${p.groupId})`);
      });
    } else {
      console.log('   No orphaned participants found.');
    }
    
    // 5. Check for duplicate participants
    console.log('\n5. Checking for duplicate participants...');
    const participantNames = {};
    const duplicates = [];
    
    allParticipants.forEach(p => {
      const key = `${p.name}_${p.groupId}`;
      if (participantNames[key]) {
        duplicates.push({
          name: p.name,
          groupId: p.groupId,
          ids: [participantNames[key].id, p.id]
        });
      } else {
        participantNames[key] = p;
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`   Found ${duplicates.length} potential duplicates:`);
      duplicates.forEach(dup => {
        console.log(`   - "${dup.name}" in group ${dup.groupId}: IDs ${dup.ids.join(', ')}`);
      });
    } else {
      console.log('   No duplicate participants found.');
    }
    
    // 6. Detailed group analysis
    console.log('\n6. Detailed group analysis:');
    groups.forEach(group => {
      const participantsInGroup = allParticipants.filter(p => p.groupId === group.id);
      console.log(`\n   Group: ${group.name} (${group.id})`);
      console.log(`   Participants (${participantsInGroup.length}):`);
      participantsInGroup.forEach(p => {
        console.log(`     - ${p.name} (ID: ${p.id})`);
      });
    });
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   Total groups in database: ${groups.length}`);
    console.log(`   Total participants in database: ${allParticipants.length}`);
    console.log(`   Participants counted in valid groups: ${totalParticipantsInGroups}`);
    console.log(`   Orphaned participants: ${orphanedParticipants.length}`);
    console.log(`   Potential duplicates: ${duplicates.length}`);
    
    // Expected vs Actual
    const expectedParticipants = groups.length * 7; // 7 participants per group
    console.log(`\n🎯 EXPECTED vs ACTUAL:`);
    console.log(`   Expected participants (${groups.length} groups × 7): ${expectedParticipants}`);
    console.log(`   Actual participants: ${allParticipants.length}`);
    console.log(`   Difference: ${allParticipants.length - expectedParticipants}`);
    
    if (allParticipants.length !== expectedParticipants) {
      console.log('\n🚨 DISCREPANCY FOUND!');
      if (orphanedParticipants.length > 0) {
        console.log(`   - ${orphanedParticipants.length} orphaned participants may be causing the discrepancy`);
      }
      if (duplicates.length > 0) {
        console.log(`   - ${duplicates.length} duplicate entries may be causing the discrepancy`);
      }
      
      // Check if any group has more than 7 participants
      const groupsWithExtraParticipants = groups.filter(group => {
        const count = allParticipants.filter(p => p.groupId === group.id).length;
        return count > 7;
      });
      
      if (groupsWithExtraParticipants.length > 0) {
        console.log(`   - Groups with more than 7 participants:`);
        groupsWithExtraParticipants.forEach(group => {
          const count = allParticipants.filter(p => p.groupId === group.id).length;
          console.log(`     * ${group.name}: ${count} participants`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error investigating data:', error);
  }
}

// Run the investigation
investigateData().then(() => {
  console.log('\n✅ Investigation complete!');
  process.exit(0);
}).catch(error => {
  console.error('Investigation failed:', error);
  process.exit(1);
});