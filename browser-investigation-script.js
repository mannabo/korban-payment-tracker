// Browser Console Investigation Script
// Copy and paste this into the browser console when logged in to the app

async function investigateDataDiscrepancy() {
  console.log('🔍 Starting browser-based data investigation...\n');
  
  try {
    // Import Firebase functions (assuming they're available in the global scope)
    const { collection, getDocs } = window.firebase.firestore;
    const { db } = window.firebase;
    
    // If Firebase isn't in global scope, you'll need to run this from the React app context
    console.log('This script should be run from the browser console while logged into the app.\n');
    
    // Get all groups
    console.log('1. Fetching groups...');
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    const groups = groupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`   Found ${groups.length} groups:`, groups);
    
    // Get all participants
    console.log('\n2. Fetching participants...');
    const participantsSnapshot = await getDocs(collection(db, 'participants'));
    const participants = participantsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`   Found ${participants.length} participants:`, participants);
    
    // Analyze participants per group
    console.log('\n3. Participants per group:');
    const groupCounts = {};
    groups.forEach(group => {
      const count = participants.filter(p => p.groupId === group.id).length;
      groupCounts[group.id] = count;
      console.log(`   ${group.name}: ${count} participants`);
    });
    
    // Check for orphaned participants
    console.log('\n4. Checking for orphaned participants...');
    const groupIds = new Set(groups.map(g => g.id));
    const orphaned = participants.filter(p => !groupIds.has(p.groupId));
    if (orphaned.length > 0) {
      console.log(`   Found ${orphaned.length} orphaned participants:`, orphaned);
    } else {
      console.log('   No orphaned participants found.');
    }
    
    // Check for duplicates
    console.log('\n5. Checking for duplicates...');
    const names = {};
    const duplicates = [];
    participants.forEach(p => {
      const key = `${p.name}_${p.groupId}`;
      if (names[key]) {
        duplicates.push({ original: names[key], duplicate: p });
      } else {
        names[key] = p;
      }
    });
    
    if (duplicates.length > 0) {
      console.log(`   Found ${duplicates.length} duplicates:`, duplicates);
    } else {
      console.log('   No duplicates found.');
    }
    
    // Summary
    const expected = groups.length * 7;
    const actual = participants.length;
    const discrepancy = actual - expected;
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Groups: ${groups.length}`);
    console.log(`   Participants: ${actual}`);
    console.log(`   Expected (${groups.length} × 7): ${expected}`);
    console.log(`   Discrepancy: ${discrepancy > 0 ? '+' : ''}${discrepancy}`);
    
    if (discrepancy !== 0) {
      console.log('\n🚨 DISCREPANCY DETECTED!');
      if (orphaned.length > 0) {
        console.log(`   - ${orphaned.length} orphaned participants may be the cause`);
      }
      if (duplicates.length > 0) {
        console.log(`   - ${duplicates.length} duplicate participants found`);
      }
      
      // Check groups with too many participants
      const overLimit = groups.filter(g => groupCounts[g.id] > 7);
      if (overLimit.length > 0) {
        console.log(`   - Groups with >7 participants:`);
        overLimit.forEach(g => {
          console.log(`     * ${g.name}: ${groupCounts[g.id]} participants`);
        });
      }
    }
    
    return {
      groups,
      participants,
      groupCounts,
      orphaned,
      duplicates,
      summary: { expected, actual, discrepancy }
    };
    
  } catch (error) {
    console.error('Investigation failed:', error);
    console.log('\nTip: Make sure you are logged in and the Firebase objects are available.');
    console.log('If this script fails, use the Data Investigation component in the app instead.');
  }
}

// Run the investigation
console.log('To run investigation, execute: investigateDataDiscrepancy()');
console.log('Or auto-run in 3 seconds...');
setTimeout(() => {
  investigateDataDiscrepancy().then(result => {
    if (result) {
      console.log('\n✅ Investigation complete! Results stored in variable above.');
      window.investigationResult = result;
      console.log('Access results via: window.investigationResult');
    }
  });
}, 3000);