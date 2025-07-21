import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createUserRole, createParticipant, updateParticipant } from './firestore';
import { auth } from './firebase';

export interface CreateParticipantAccountData {
  name: string;
  email: string;
  phone?: string;
  groupId: string;
  temporaryPassword?: string;
}

export const createParticipantAccount = async (data: CreateParticipantAccountData) => {
  try {
    // Generate temporary password if not provided
    const password = data.temporaryPassword || generateTemporaryPassword();
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, password);
    const user = userCredential.user;
    
    // Update user profile with display name
    await updateProfile(user, {
      displayName: data.name
    });
    
    // Create participant record
    const participantId = await createParticipant({
      name: data.name,
      email: data.email,
      phone: data.phone,
      groupId: data.groupId,
      userId: user.uid,
      sacrificeType: 'korban_sunat'
    });
    
    // Create user role record
    await createUserRole({
      email: data.email,
      role: 'participant',
      participantId: participantId,
      displayName: data.name
    });
    
    // Update participant with userId link
    await updateParticipant(participantId, {
      userId: user.uid
    });
    
    return {
      success: true,
      participantId,
      userId: user.uid,
      temporaryPassword: password
    };
    
  } catch (error: any) {
    console.error('Error creating participant account:', error);
    throw new Error(error.message || 'Failed to create participant account');
  }
};

export const generateTemporaryPassword = (): string => {
  // Generate a simple temporary password (in production, use a more secure method)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const setupInitialAdmin = async (email: string) => {
  try {
    // Create admin user role record
    await createUserRole({
      email: email,
      role: 'admin',
      displayName: 'Admin'
    });
    
    return { success: true };
    
  } catch (error: any) {
    console.error('Error setting up initial admin:', error);
    throw new Error(error.message || 'Failed to setup admin role');
  }
};