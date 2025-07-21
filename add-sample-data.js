// Script untuk tambah sample data ke Firebase selepas update rules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

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

async function addSampleData() {
  try {
    console.log('🚀 Menambah sample groups...');
    
    // Tambah sample groups
    const groups = [
      { name: 'Kumpulan 1', description: 'Kumpulan peserta bahagian 1' },
      { name: 'Kumpulan 2', description: 'Kumpulan peserta bahagian 2' },
      { name: 'Kumpulan 3', description: 'Kumpulan peserta bahagian 3' },
      { name: 'Kumpulan 4', description: 'Kumpulan peserta bahagian 4' },
      { name: 'Kumpulan 5', description: 'Kumpulan peserta bahagian 5' },
      { name: 'Kumpulan 6', description: 'Kumpulan peserta bahagian 6' },
      { name: 'Kumpulan 7', description: 'Kumpulan peserta bahagian 7' },
      { name: 'Kumpulan 8', description: 'Kumpulan peserta bahagian 8' },
      { name: 'Kumpulan 9', description: 'Kumpulan peserta bahagian 9' },
      { name: 'Kumpulan 10', description: 'Kumpulan peserta bahagian 10' }
    ];

    const groupIds = [];
    for (const group of groups) {
      const docRef = await addDoc(collection(db, 'groups'), group);
      groupIds.push(docRef.id);
      console.log(`✅ Group "${group.name}" ditambah dengan ID: ${docRef.id}`);
    }

    console.log('🚀 Menambah sample participants...');
    
    // Tambah sample participants
    const participants = [
      // Kumpulan 1
      { name: 'Ahmad Bin Ali', email: 'ahmad.ali@email.com', phone: '012-3456789', groupId: groupIds[0] },
      { name: 'Siti Fatimah', email: 'siti@email.com', phone: '012-9876543', groupId: groupIds[0] },
      { name: 'Muhammad Hassan', email: 'hassan@email.com', phone: '013-1234567', groupId: groupIds[0] },
      
      // Kumpulan 2
      { name: 'Khadijah Omar', email: 'khadijah@email.com', phone: '014-7654321', groupId: groupIds[1] },
      { name: 'Ibrahim Rahman', email: 'ibrahim@email.com', phone: '015-9999999', groupId: groupIds[1] },
      { name: 'Aminah Kassim', email: 'aminah@email.com', phone: '016-1111111', groupId: groupIds[1] },
      
      // Kumpulan 3
      { name: 'Omar Abdullah', email: 'omar@email.com', phone: '017-1111111', groupId: groupIds[2] },
      { name: 'Yusuf Ahmad', email: 'yusuf@email.com', phone: '018-2222222', groupId: groupIds[2] },
      { name: 'Zainab Ibrahim', email: 'zainab@email.com', phone: '011-4444444', groupId: groupIds[2] },
      
      // Kumpulan 4
      { name: 'Maryam Yusuf', email: 'maryam@email.com', phone: '010-5555555', groupId: groupIds[3] },
      { name: 'Hafsah Ahmad', email: 'hafsah@email.com', phone: '013-6666666', groupId: groupIds[3] },
      
      // Kumpulan 5
      { name: 'Ismail Daud', email: 'ismail@email.com', phone: '019-3333333', groupId: groupIds[4] },
      { name: 'Aisyah Binti Rahman', email: 'aisyah@email.com', phone: '012-5555555', groupId: groupIds[4] },
      
      // Kumpulan 6
      { name: 'Hasan Bin Abdullah', email: 'hasan@email.com', phone: '013-7777777', groupId: groupIds[5] },
      { name: 'Fatimah Zahra', email: 'fatimah@email.com', phone: '014-8888888', groupId: groupIds[5] },
      { name: 'Ali Bin Omar', email: 'ali@email.com', phone: '015-9999999', groupId: groupIds[5] },
      
      // Kumpulan 7
      { name: 'Noor Ain Binti Yusuf', email: 'noorain@email.com', phone: '016-1010101', groupId: groupIds[6] },
      { name: 'Rashid Bin Hassan', email: 'rashid@email.com', phone: '017-2020202', groupId: groupIds[6] },
      
      // Kumpulan 8
      { name: 'Mariam Binti Ahmad', email: 'mariam@email.com', phone: '018-3030303', groupId: groupIds[7] },
      { name: 'Zakaria Bin Ibrahim', email: 'zakaria@email.com', phone: '019-4040404', groupId: groupIds[7] },
      { name: 'Halimah Binti Omar', email: 'halimah@email.com', phone: '010-5050505', groupId: groupIds[7] },
      
      // Kumpulan 9
      { name: 'Idris Bin Mahmud', email: 'idris@email.com', phone: '011-6060606', groupId: groupIds[8] },
      { name: 'Ruqayyah Binti Ali', email: 'ruqayyah@email.com', phone: '012-7070707', groupId: groupIds[8] },
      
      // Kumpulan 10
      { name: 'Usman Bin Yusuf', email: 'usman@email.com', phone: '013-8080808', groupId: groupIds[9] },
      { name: 'Khadijah Binti Hassan', email: 'khadijah2@email.com', phone: '014-9090909', groupId: groupIds[9] },
      { name: 'Sulaiman Bin Omar', email: 'sulaiman@email.com', phone: '015-1010101', groupId: groupIds[9] }
    ];

    for (const participant of participants) {
      const docRef = await addDoc(collection(db, 'participants'), participant);
      console.log(`✅ Participant "${participant.name}" ditambah dengan ID: ${docRef.id}`);
    }

    console.log('🎉 Sample data berjaya ditambah!');
    console.log(`📊 Total: ${groups.length} groups, ${participants.length} participants`);
    
  } catch (error) {
    console.error('❌ Error menambah sample data:', error);
  }
}

addSampleData();