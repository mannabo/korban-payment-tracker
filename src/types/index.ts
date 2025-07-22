export type SacrificeType = 'korban_sunat' | 'korban_nazar' | 'aqiqah';

export interface Participant {
  id: string;
  name: string;
  groupId: string;
  phone?: string;
  email?: string;
  userId?: string; // Link to Firebase Auth user
  sacrificeType: SacrificeType; // Default: korban_sunat
}

export interface UserRole {
  id: string;
  email: string;
  role: 'admin' | 'participant';
  participantId?: string; // For participant role
  displayName?: string;
}

export interface Group {
  id: string;
  name: string;
  participants: Participant[];
}

export interface Payment {
  id: string;
  participantId: string;
  month: string; // Format: "2025-08"
  amount: number;
  isPaid: boolean;
  paidDate?: Date;
  notes?: string;
}

export interface PaymentSummary {
  groupId: string;
  groupName: string;
  month: string;
  totalParticipants: number;
  totalPaid: number;
  totalAmount: number;
  completionPercentage: number;
}

export interface ParticipantChangeRequest {
  id: string;
  participantId: string;
  requestedBy: string; // participant's userId
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string; // admin's userId
  approvedAt?: Date;
  changes: {
    name?: string;
    phone?: string;
    email?: string;
    sacrificeType?: SacrificeType;
  };
  notes?: string;
}

export interface AuditLog {
  id: string;
  participantId: string;
  action: 'detail_change_requested' | 'detail_change_approved' | 'detail_change_rejected' | 'detail_updated';
  performedBy: string; // userId
  performedAt: Date;
  details: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    requestId?: string;
    notes?: string;
  };
}

export interface ReceiptUpload {
  id?: string;
  participantId: string;
  month: string;
  amount: number;
  receiptImageUrl: string;
  uploadDate: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedBy?: string;
  approvedDate?: Date;
  notes?: string;
  fileType?: 'image' | 'pdf'; // Track file type for proper display
}

export interface CreditTransaction {
  date: Date;
  amount: number;
  type: 'payment' | 'usage' | 'adjustment';
  receiptId?: string;
  month?: string;
  description: string;
}

export interface ParticipantCredit {
  id?: string;
  participantId: string;
  creditBalance: number; // RM amount (positive = overpaid, negative = underpaid)
  lastUpdated: Date;
  transactions: CreditTransaction[];
}

export const MONTHS = [
  '2025-08', '2025-09', '2025-10', '2025-11',
  '2025-12', '2026-01', '2026-02', '2026-03'
];

export const MONTH_LABELS: { [key: string]: string } = {
  '2025-08': 'Ogos 2025',
  '2025-09': 'September 2025',
  '2025-10': 'Oktober 2025',
  '2025-11': 'November 2025',
  '2025-12': 'Disember 2025',
  '2026-01': 'Januari 2026',
  '2026-02': 'Februari 2026',
  '2026-03': 'Mac 2026'
};

// Sacrifice type labels and pricing
export const SACRIFICE_TYPE_LABELS: { [key in SacrificeType]: string } = {
  korban_sunat: 'Korban Sunat',
  korban_nazar: 'Korban Nazar',
  aqiqah: 'Aqiqah'
};

export const SACRIFICE_TYPE_PRICING: { [key in SacrificeType]: number } = {
  korban_sunat: 100,   // RM100 per month per participant
  korban_nazar: 100,   // RM100 per month per participant  
  aqiqah: 100          // RM100 per month per participant
};

export const SACRIFICE_TYPE_DESCRIPTIONS: { [key in SacrificeType]: string } = {
  korban_sunat: 'Korban sunat pada Hari Raya Haji',
  korban_nazar: 'Korban nazar atas janji kepada Allah',
  aqiqah: 'Aqiqah untuk anak yang baru lahir'
};

// Helper function to get price for a participant
export const getParticipantPrice = (sacrificeType: SacrificeType): number => {
  return SACRIFICE_TYPE_PRICING[sacrificeType];
};

// Color themes for different sacrifice types
export const SACRIFICE_TYPE_COLORS = {
  korban_sunat: {
    primary: '#16a34a',      // Green
    secondary: '#15803d',
    light: '#f0fdf4',
    border: '#bbf7d0',
    text: '#166534'
  },
  korban_nazar: {
    primary: '#2563eb',      // Blue
    secondary: '#1d4ed8',
    light: '#eff6ff',
    border: '#bfdbfe',
    text: '#1e40af'
  },
  aqiqah: {
    primary: '#f59e0b',      // Yellow/Gold
    secondary: '#d97706',
    light: '#fef3c7',
    border: '#fde68a',
    text: '#92400e'
  }
};

// Helper function to get color theme for sacrifice type
export const getSacrificeTypeColors = (sacrificeType: SacrificeType) => {
  return SACRIFICE_TYPE_COLORS[sacrificeType];
};

// Legacy constants for backward compatibility
export const KORBAN_PRICE_PER_PARTICIPANT = 800; // RM800 total per participant (RM100 x 8 months)
export const KORBAN_MONTHLY_AMOUNT = 100; // RM100 per month per participant
export const KORBAN_PARTS_PER_COW = 7; // 7 bahagian dalam 1 lembu
export const KORBAN_COLLECTION_MONTHS = 8; // 8 bulan kutipan (Ogos 2025 - Mac 2026)