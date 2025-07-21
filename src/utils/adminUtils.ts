import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface CreateAdminData {
  email: string;
  password: string;
  displayName: string;
}

/**
 * Creates a new admin account - Should only be used by super admins
 * This function bypasses normal registration restrictions
 */
export const createAdminAccount = async (adminData: CreateAdminData): Promise<string> => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      adminData.email, 
      adminData.password
    );
    
    const user = userCredential.user;
    
    // Update display name
    await updateProfile(user, {
      displayName: adminData.displayName
    });
    
    // Create admin role record in Firestore
    await setDoc(doc(db, 'userRoles', adminData.email), {
      role: 'admin',
      email: adminData.email,
      displayName: adminData.displayName,
      createdAt: new Date(),
      createdBy: auth.currentUser?.email || 'system'
    });
    
    console.log(`✅ Admin account created: ${adminData.email}`);
    return user.uid;
    
  } catch (error: any) {
    console.error('❌ Failed to create admin account:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email sudah digunakan untuk account lain');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password terlalu lemah. Minimum 6 characters');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Format email tidak valid');
    } else {
      throw new Error('Gagal membuat admin account');
    }
  }
};

/**
 * Development helper - Creates initial super admin
 * WARNING: Use this only for initial setup!
 */
export const createInitialSuperAdmin = async (): Promise<void> => {
  const superAdminData: CreateAdminData = {
    email: 'admin@masjid-alfalah.org',
    password: 'TempAdmin123!',
    displayName: 'Super Admin'
  };
  
  try {
    await createAdminAccount(superAdminData);
    console.log('🔑 Initial super admin created successfully');
    console.log('📧 Email: admin@masjid-alfalah.org');
    console.log('🔐 Password: TempAdmin123!');
    console.log('⚠️  IMPORTANT: Change password immediately after first login!');
  } catch (error) {
    console.error('Failed to create initial super admin:', error);
  }
};

/**
 * Lists all admin accounts - for super admin use
 */
export const listAdminAccounts = async (): Promise<any[]> => {
  try {
    const { getDocs, collection, query, where } = await import('firebase/firestore');
    
    const adminQuery = query(
      collection(db, 'userRoles'), 
      where('role', '==', 'admin')
    );
    
    const snapshot = await getDocs(adminQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error listing admin accounts:', error);
    return [];
  }
};