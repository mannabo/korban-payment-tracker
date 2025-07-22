import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { ParticipantCredit, CreditTransaction } from '../types';

export class CreditService {
  private static instance: CreditService;
  
  public static getInstance(): CreditService {
    if (!CreditService.instance) {
      CreditService.instance = new CreditService();
    }
    return CreditService.instance;
  }

  /**
   * Get participant's credit balance
   */
  async getParticipantCredit(participantId: string): Promise<ParticipantCredit | null> {
    try {
      const creditRef = doc(db, 'participantCredits', participantId);
      const creditDoc = await getDoc(creditRef);
      
      if (creditDoc.exists()) {
        const data = creditDoc.data();
        return {
          id: creditDoc.id,
          participantId: data.participantId,
          creditBalance: data.creditBalance || 0,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          transactions: data.transactions || []
        } as ParticipantCredit;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting participant credit:', error);
      return null;
    }
  }

  /**
   * Initialize credit record for new participant
   */
  async initializeParticipantCredit(participantId: string): Promise<ParticipantCredit> {
    const creditData: ParticipantCredit = {
      participantId,
      creditBalance: 0,
      lastUpdated: new Date(),
      transactions: []
    };

    const creditRef = doc(db, 'participantCredits', participantId);
    await setDoc(creditRef, {
      ...creditData,
      lastUpdated: serverTimestamp()
    });

    return creditData;
  }

  /**
   * Add credit from payment
   */
  async addPaymentCredit(
    participantId: string, 
    amount: number, 
    receiptId: string, 
    description: string
  ): Promise<void> {
    try {
      let credit = await this.getParticipantCredit(participantId);
      
      if (!credit) {
        credit = await this.initializeParticipantCredit(participantId);
      }

      const transaction: CreditTransaction = {
        date: new Date(),
        amount: amount,
        type: 'payment',
        receiptId,
        description
      };

      const updatedCredit: Partial<ParticipantCredit> = {
        creditBalance: credit.creditBalance + amount,
        lastUpdated: new Date(),
        transactions: [...credit.transactions, transaction]
      };

      const creditRef = doc(db, 'participantCredits', participantId);
      await updateDoc(creditRef, {
        ...updatedCredit,
        lastUpdated: serverTimestamp()
      });

    } catch (error) {
      console.error('Error adding payment credit:', error);
      throw error;
    }
  }

  /**
   * Use credit for monthly payment
   */
  async useCredit(
    participantId: string, 
    amount: number, 
    month: string, 
    description: string
  ): Promise<boolean> {
    try {
      const credit = await this.getParticipantCredit(participantId);
      
      if (!credit || credit.creditBalance < amount) {
        return false; // Insufficient credit
      }

      const transaction: CreditTransaction = {
        date: new Date(),
        amount: -amount, // Negative because it's usage
        type: 'usage',
        month,
        description
      };

      const updatedCredit: Partial<ParticipantCredit> = {
        creditBalance: credit.creditBalance - amount,
        lastUpdated: new Date(),
        transactions: [...credit.transactions, transaction]
      };

      const creditRef = doc(db, 'participantCredits', participantId);
      await updateDoc(creditRef, {
        ...updatedCredit,
        lastUpdated: serverTimestamp()
      });

      return true;

    } catch (error) {
      console.error('Error using credit:', error);
      return false;
    }
  }

  /**
   * Get all participants with credit balances
   */
  async getAllParticipantCredits(): Promise<ParticipantCredit[]> {
    try {
      const creditsRef = collection(db, 'participantCredits');
      const querySnapshot = await getDocs(creditsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        participantId: doc.data().participantId,
        creditBalance: doc.data().creditBalance || 0,
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date(),
        transactions: doc.data().transactions || []
      }));
      
    } catch (error) {
      console.error('Error getting all participant credits:', error);
      return [];
    }
  }

  /**
   * Calculate how many months ahead this participant is paid
   */
  calculatePrepaidMonths(creditBalance: number): number {
    return Math.floor(creditBalance / 100);
  }

  /**
   * Get next unpaid month considering credit balance
   */
  getNextUnpaidMonth(creditBalance: number, currentMonth: string, allMonths: string[]): string | null {
    const prepaidMonths = this.calculatePrepaidMonths(creditBalance);
    const currentIndex = allMonths.indexOf(currentMonth);
    
    if (currentIndex === -1) return allMonths[0];
    
    const nextIndex = currentIndex + prepaidMonths + 1;
    return nextIndex < allMonths.length ? allMonths[nextIndex] : null;
  }

  /**
   * Process multi-month payment with credit system
   */
  async processMultiMonthPayment(
    participantId: string,
    totalAmount: number,
    selectedMonths: string[],
    receiptId: string
  ): Promise<{ 
    paymentsCreated: number, 
    creditAdded: number, 
    summary: string 
  }> {
    const standardAmount = 100;
    const totalNeeded = selectedMonths.length * standardAmount;
    const excessAmount = totalAmount - totalNeeded;

    // Add total amount as credit
    await this.addPaymentCredit(
      participantId, 
      totalAmount, 
      receiptId, 
      `Payment for ${selectedMonths.length} months (${selectedMonths.join(', ')})`
    );

    // Use credit for each selected month
    let paymentsCreated = 0;
    for (const month of selectedMonths) {
      const success = await this.useCredit(
        participantId, 
        standardAmount, 
        month, 
        `Monthly payment for ${month}`
      );
      
      if (success) {
        paymentsCreated++;
      }
    }

    const summary = excessAmount > 0 
      ? `${paymentsCreated} payments created, RM${excessAmount} credit remaining`
      : excessAmount < 0
      ? `${paymentsCreated} payments created, RM${Math.abs(excessAmount)} shortfall`
      : `${paymentsCreated} payments created, exact amount`;

    return {
      paymentsCreated,
      creditAdded: excessAmount,
      summary
    };
  }
}

export default CreditService;