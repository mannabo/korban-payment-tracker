import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Group, Participant, Payment, UserRole, ParticipantChangeRequest, AuditLog, SacrificeType } from '../types';

// Groups
export const createGroup = async (groupData: Omit<Group, 'id'>) => {
  const docRef = await addDoc(collection(db, 'groups'), groupData);
  return docRef.id;
};

export const updateGroup = async (id: string, groupData: Partial<Group>) => {
  const docRef = doc(db, 'groups', id);
  await updateDoc(docRef, groupData);
};

export const deleteGroup = async (id: string) => {
  const docRef = doc(db, 'groups', id);
  await deleteDoc(docRef);
};

export const getGroups = async (): Promise<Group[]> => {
  const querySnapshot = await getDocs(collection(db, 'groups'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Group[];
};

export const getGroup = async (id: string): Promise<Group | null> => {
  const docRef = doc(db, 'groups', id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Group;
  }
  return null;
};

// Participants
export const createParticipant = async (participantData: Omit<Participant, 'id'>) => {
  const docRef = await addDoc(collection(db, 'participants'), participantData);
  return docRef.id;
};

export const updateParticipant = async (id: string, participantData: Partial<Participant>) => {
  const docRef = doc(db, 'participants', id);
  await updateDoc(docRef, participantData);
};

export const deleteParticipant = async (id: string) => {
  const docRef = doc(db, 'participants', id);
  await deleteDoc(docRef);
};

export const getParticipantsByGroup = async (groupId: string): Promise<Participant[]> => {
  const q = query(
    collection(db, 'participants'),
    where('groupId', '==', groupId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Participant[];
};

export const getAllParticipants = async (): Promise<Participant[]> => {
  const querySnapshot = await getDocs(collection(db, 'participants'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Participant[];
};

// Payments
export const createPayment = async (paymentData: Omit<Payment, 'id'>) => {
  // Check for existing payment for this participant and month
  const q = query(
    collection(db, 'payments'),
    where('participantId', '==', paymentData.participantId),
    where('month', '==', paymentData.month)
  );
  const existingPayments = await getDocs(q);
  
  if (!existingPayments.empty) {
    // If payment exists, update instead of creating new
    const existingPayment = existingPayments.docs[0];
    const updateData = {
      ...paymentData,
      paidDate: paymentData.paidDate ? Timestamp.fromDate(paymentData.paidDate) : null
    };
    await updateDoc(existingPayment.ref, updateData);
    return existingPayment.id;
  }
  
  // Create new payment if doesn't exist
  const data = {
    ...paymentData,
    paidDate: paymentData.paidDate ? Timestamp.fromDate(paymentData.paidDate) : null
  };
  const docRef = await addDoc(collection(db, 'payments'), data);
  return docRef.id;
};

export const updatePayment = async (id: string, paymentData: Partial<Payment>) => {
  const data = {
    ...paymentData,
    paidDate: paymentData.paidDate ? Timestamp.fromDate(paymentData.paidDate) : null
  };
  const docRef = doc(db, 'payments', id);
  await updateDoc(docRef, data);
};

export const deletePayment = async (id: string) => {
  const docRef = doc(db, 'payments', id);
  await deleteDoc(docRef);
};

export const getPaymentsByParticipant = async (participantId: string): Promise<Payment[]> => {
  const q = query(
    collection(db, 'payments'),
    where('participantId', '==', participantId)
  );
  const querySnapshot = await getDocs(q);
  const payments = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      paidDate: data.paidDate ? data.paidDate.toDate() : undefined
    };
  }) as Payment[];
  
  // Sort manually to avoid index requirement
  return payments.sort((a, b) => a.month.localeCompare(b.month));
};

export const getPaymentsByMonth = async (month: string): Promise<Payment[]> => {
  const q = query(
    collection(db, 'payments'),
    where('month', '==', month)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      paidDate: data.paidDate ? data.paidDate.toDate() : undefined
    };
  }) as Payment[];
};

export const getAllPayments = async (): Promise<Payment[]> => {
  const querySnapshot = await getDocs(collection(db, 'payments'));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      paidDate: data.paidDate ? data.paidDate.toDate() : undefined
    };
  }) as Payment[];
};

// Real-time listeners
export const subscribeToGroups = (callback: (groups: Group[]) => void) => {
  const unsubscribe = onSnapshot(collection(db, 'groups'), (snapshot) => {
    const groups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Group[];
    callback(groups);
  });
  return unsubscribe;
};

export const subscribeToParticipants = (groupId: string, callback: (participants: Participant[]) => void) => {
  const q = query(
    collection(db, 'participants'),
    where('groupId', '==', groupId)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const participants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Participant[];
    callback(participants);
  });
  return unsubscribe;
};

export const subscribeToAllParticipants = (callback: (participants: Participant[]) => void) => {
  const unsubscribe = onSnapshot(collection(db, 'participants'), (snapshot) => {
    const participants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Participant[];
    callback(participants);
  });
  return unsubscribe;
};

export const subscribeToPayments = (month: string, callback: (payments: Payment[]) => void) => {
  const q = query(
    collection(db, 'payments'),
    where('month', '==', month)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const payments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        paidDate: data.paidDate ? data.paidDate.toDate() : undefined
      };
    }) as Payment[];
    callback(payments);
  });
  return unsubscribe;
};

// User roles
export const createUserRole = async (userRoleData: Omit<UserRole, 'id'>) => {
  const docRef = await addDoc(collection(db, 'userRoles'), userRoleData);
  return docRef.id;
};

export const getUserRole = async (email: string): Promise<UserRole | null> => {
  const q = query(
    collection(db, 'userRoles'),
    where('email', '==', email)
  );
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as UserRole;
  }
  return null;
};

export const updateUserRole = async (id: string, userRoleData: Partial<UserRole>) => {
  const docRef = doc(db, 'userRoles', id);
  await updateDoc(docRef, userRoleData);
};

export const deleteUserRole = async (id: string) => {
  const docRef = doc(db, 'userRoles', id);
  await deleteDoc(docRef);
};

// Participant Change Requests
export const createChangeRequest = async (changeRequestData: Omit<ParticipantChangeRequest, 'id'>) => {
  const data = {
    ...changeRequestData,
    requestedAt: Timestamp.fromDate(changeRequestData.requestedAt),
    approvedAt: changeRequestData.approvedAt ? Timestamp.fromDate(changeRequestData.approvedAt) : null
  };
  const docRef = await addDoc(collection(db, 'participantChangeRequests'), data);
  return docRef.id;
};

export const getChangeRequestsByParticipant = async (participantId: string): Promise<ParticipantChangeRequest[]> => {
  const q = query(
    collection(db, 'participantChangeRequests'),
    where('participantId', '==', participantId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      requestedAt: data.requestedAt ? data.requestedAt.toDate() : new Date(),
      approvedAt: data.approvedAt ? data.approvedAt.toDate() : undefined
    };
  }) as ParticipantChangeRequest[];
};

export const getPendingChangeRequests = async (): Promise<ParticipantChangeRequest[]> => {
  const q = query(
    collection(db, 'participantChangeRequests'),
    where('status', '==', 'pending')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      requestedAt: data.requestedAt ? data.requestedAt.toDate() : new Date(),
      approvedAt: data.approvedAt ? data.approvedAt.toDate() : undefined
    };
  }) as ParticipantChangeRequest[];
};

export const updateChangeRequest = async (id: string, updateData: Partial<ParticipantChangeRequest>) => {
  const data = {
    ...updateData,
    approvedAt: updateData.approvedAt ? Timestamp.fromDate(updateData.approvedAt) : null
  };
  const docRef = doc(db, 'participantChangeRequests', id);
  await updateDoc(docRef, data);
};

export const approveChangeRequest = async (
  requestId: string, 
  approvedBy: string, 
  participantId: string, 
  changes: { name?: string; phone?: string; email?: string; sacrificeType?: SacrificeType }
) => {
  try {
    const now = new Date();
    
    // Update the change request status
    await updateChangeRequest(requestId, {
      status: 'approved',
      approvedBy,
      approvedAt: now
    });
    
    // Apply changes to participant
    await updateParticipant(participantId, changes);
    
    // Create audit logs for each changed field
    const auditLogs = [];
    for (const [field, newValue] of Object.entries(changes)) {
      if (newValue) {
        auditLogs.push({
          participantId,
          action: 'detail_change_approved' as const,
          performedBy: approvedBy,
          performedAt: now,
          details: {
            field,
            newValue,
            requestId,
            notes: `Admin approved change request for ${field}`
          }
        });
      }
    }
    
    // Create audit logs
    for (const auditLog of auditLogs) {
      await createAuditLog(auditLog);
    }
    
    return true;
  } catch (error) {
    console.error('Error approving change request:', error);
    throw error;
  }
};

export const rejectChangeRequest = async (requestId: string, approvedBy: string, notes?: string) => {
  const now = new Date();
  await updateChangeRequest(requestId, {
    status: 'rejected',
    approvedBy,
    approvedAt: now,
    notes
  });
};

// Audit Logs
export const createAuditLog = async (auditLogData: Omit<AuditLog, 'id'>) => {
  const data = {
    ...auditLogData,
    performedAt: Timestamp.fromDate(auditLogData.performedAt)
  };
  const docRef = await addDoc(collection(db, 'auditLogs'), data);
  return docRef.id;
};

export const getAuditLogsByParticipant = async (participantId: string): Promise<AuditLog[]> => {
  const q = query(
    collection(db, 'auditLogs'),
    where('participantId', '==', participantId)
  );
  const querySnapshot = await getDocs(q);
  const logs = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      performedAt: data.performedAt ? data.performedAt.toDate() : new Date()
    };
  }) as AuditLog[];
  
  // Sort by date (newest first)
  return logs.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
};

export const getAllAuditLogs = async (): Promise<AuditLog[]> => {
  const querySnapshot = await getDocs(collection(db, 'auditLogs'));
  const logs = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      performedAt: data.performedAt ? data.performedAt.toDate() : new Date()
    };
  }) as AuditLog[];
  
  // Sort by date (newest first)
  return logs.sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
};

// Real-time listeners for change requests
export const subscribeToChangeRequests = (callback: (requests: ParticipantChangeRequest[]) => void) => {
  const unsubscribe = onSnapshot(collection(db, 'participantChangeRequests'), (snapshot) => {
    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestedAt: data.requestedAt ? data.requestedAt.toDate() : new Date(),
        approvedAt: data.approvedAt ? data.approvedAt.toDate() : undefined
      };
    }) as ParticipantChangeRequest[];
    callback(requests);
  });
  return unsubscribe;
};

export const subscribeToPendingChangeRequests = (callback: (requests: ParticipantChangeRequest[]) => void) => {
  const q = query(
    collection(db, 'participantChangeRequests'),
    where('status', '==', 'pending')
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestedAt: data.requestedAt ? data.requestedAt.toDate() : new Date(),
        approvedAt: data.approvedAt ? data.approvedAt.toDate() : undefined
      };
    }) as ParticipantChangeRequest[];
    callback(requests);
  });
  return unsubscribe;
};

// Clean up orphaned participants
export const deleteOrphanedParticipants = async () => {
  try {
    // Get all groups and participants
    const groupsSnapshot = await getDocs(collection(db, 'groups'));
    const participantsSnapshot = await getDocs(collection(db, 'participants'));
    
    const groupIds = groupsSnapshot.docs.map(doc => doc.id);
    const orphanedParticipants = participantsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return !groupIds.includes(data.groupId);
    });
    
    console.log('Found orphaned participants:', orphanedParticipants.length);
    
    // Delete orphaned participants
    for (const participantDoc of orphanedParticipants) {
      await deleteDoc(participantDoc.ref);
      console.log('Deleted orphaned participant:', participantDoc.data().name);
    }
    
    return orphanedParticipants.length;
  } catch (error) {
    console.error('Error cleaning orphaned participants:', error);
    throw error;
  }
};