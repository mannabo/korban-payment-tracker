import { Participant, Payment } from '../types';
import { MONTH_LABELS, KORBAN_MONTHLY_AMOUNT } from '../types';

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailReminderData {
  participant: Participant;
  unpaidMonths: string[];
  totalOwed: number;
  nextDueDate: string;
}

export interface GroupedEmailData {
  email: string;
  participants: Array<{
    participant: Participant;
    unpaidMonths: string[];
    totalOwed: number;
  }>;
  combinedTotalOwed: number;
  familyCount: number;
}

export interface EmailConfig {
  adminEmail: string;
  organizationName: string;
  fromName: string;
  replyToEmail: string;
  signatureText: string;
}

export class EmailService {
  private static instance: EmailService;
  private config!: EmailConfig; // Use definite assignment assertion
  
  private constructor() {
    // Load config from localStorage with defaults
    this.loadConfig();
  }
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private loadConfig(): void {
    const defaultConfig: EmailConfig = {
      adminEmail: 'masjid.hangtuahsagil@gmail.com',
      organizationName: 'Masjid Hang Tuah Sagil',
      fromName: 'Jawatankuasa Program Korban',
      replyToEmail: 'masjid.hangtuahsagil@gmail.com',
      signatureText: 'Wassalamualaikum warahmatullahi wabarakatuh\n\nJawatankuasa Program Korban\nMasjid Hang Tuah Sagil'
    };

    try {
      const savedConfig = localStorage.getItem('korban_email_config');
      if (savedConfig) {
        this.config = { ...defaultConfig, ...JSON.parse(savedConfig) };
      } else {
        this.config = defaultConfig;
      }
    } catch (error) {
      console.error('Error loading email config:', error);
      this.config = defaultConfig;
    }
  }

  public getConfig(): EmailConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<EmailConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public refreshConfig(): void {
    this.loadConfig();
  }

  /**
   * Generate email template for single participant payment reminder
   */
  generatePaymentReminderTemplate(data: EmailReminderData): EmailTemplate {
    const { participant, unpaidMonths, totalOwed, nextDueDate } = data;
    
    const monthsList = unpaidMonths
      .map(month => `• ${MONTH_LABELS[month] || month}`)
      .join('\n');

    const subject = `🕌 Peringatan Pembayaran Korban - ${participant.name}`;
    
    const body = `
Assalamualaikum ${participant.name},

Semoga anda dalam keadaan sihat dan sejahtera.

🌙 **Program Korban Perdana Hari Raya Haji 2026**

Kami ingin mengingatkan bahawa terdapat pembayaran yang masih tertunggak untuk Program Korban anda:

📅 **Bulan-bulan yang perlu dibayar:**
${monthsList}

💰 **Jumlah keseluruhan tertunggak:** RM${totalOwed}
💳 **Bayaran bulanan:** RM${KORBAN_MONTHLY_AMOUNT}

📆 **Tarikh bayaran seterusnya:** ${nextDueDate}

🕌 **Jenis Korban:** ${this.getSacrificeTypeLabel(participant.sacrificeType)}

---

**Cara Pembayaran:**
1. Tunai kepada bendahari kumpulan
2. Transfer bank (hubungi admin untuk maklumat bank)
3. Upload resit pembayaran melalui portal online

📱 **Portal Online:** 
• Semak status pembayaran: [Link Portal]
• Upload resit pembayaran: [Link Upload]

📞 **Hubungi Kami:**
• Noor Azman bin Omar: 014-6168216
• Email: ${this.config.replyToEmail}

Jazakallahu khairan atas kerjasama anda.

${this.config.signatureText}

**${this.config.fromName}**
${this.config.organizationName}
`;

    return { subject, body };
  }

  /**
   * Generate email template for grouped family payment reminder
   */
  generateGroupedPaymentReminderTemplate(data: GroupedEmailData): EmailTemplate {
    const { participants, combinedTotalOwed, familyCount } = data;
    
    const subject = `🕌 Peringatan Pembayaran Korban - ${familyCount} Peserta Keluarga`;
    
    // Create participant details section
    const participantDetails = participants.map(({ participant, unpaidMonths, totalOwed }) => {
      const monthsList = unpaidMonths
        .map(month => `   • ${MONTH_LABELS[month] || month}`)
        .join('\n');
      
      return `👤 **${participant.name}**
   🕌 Jenis: ${this.getSacrificeTypeLabel(participant.sacrificeType)}
   📅 Bulan tertunggak:
${monthsList}
   💰 Jumlah: RM${totalOwed}`;
    }).join('\n\n');

    const body = `
Assalamualaikum,

Semoga anda dalam keadaan sihat dan sejahtera.

🌙 **Program Korban Perdana Hari Raya Haji 2026**

Kami ingin mengingatkan bahawa terdapat pembayaran yang masih tertunggak untuk ${familyCount} peserta dalam keluarga anda:

${participantDetails}

💰 **RINGKASAN KESELURUHAN:**
• Jumlah keseluruhan tertunggak: RM${combinedTotalOwed}
• Bilangan peserta: ${familyCount}
• Bayaran bulanan per peserta: RM${KORBAN_MONTHLY_AMOUNT}

---

**Cara Pembayaran:**
1. Tunai kepada bendahari kumpulan
2. Transfer bank (hubungi admin untuk maklumat bank)
3. Upload resit pembayaran melalui portal online

📱 **Portal Online:** 
• Semak status pembayaran: [Link Portal]
• Upload resit pembayaran: [Link Upload]

📞 **Hubungi Kami:**
• Noor Azman bin Omar: 014-6168216
• Email: ${this.config.replyToEmail}

Jazakallahu khairan atas kerjasama anda.

${this.config.signatureText}

**${this.config.fromName}**
${this.config.organizationName}
`;

    return { subject, body };
  }

  /**
   * Generate monthly payment summary email for admins
   */
  generateMonthlySummaryTemplate(month: string, summary: {
    totalParticipants: number;
    totalPaid: number;
    totalUnpaid: number;
    collectionPercentage: number;
    totalAmount: number;
  }): EmailTemplate {
    const subject = `📊 Laporan Bulanan Korban - ${MONTH_LABELS[month] || month}`;
    
    const body = `
Assalamualaikum,

**Laporan Pembayaran Korban - ${MONTH_LABELS[month] || month}**

📊 **Ringkasan Pembayaran:**
• Total Peserta: ${summary.totalParticipants}
• Sudah Bayar: ${summary.totalPaid}
• Belum Bayar: ${summary.totalUnpaid}
• Peratus Kutipan: ${summary.collectionPercentage.toFixed(1)}%

💰 **Kutipan Kewangan:**
• Jumlah Dikutip: RM${(summary.totalPaid * KORBAN_MONTHLY_AMOUNT).toLocaleString()}
• Jumlah Keseluruhan: RM${summary.totalAmount.toLocaleString()}

📈 **Status:** ${summary.collectionPercentage >= 80 ? '✅ Baik' : 
                 summary.collectionPercentage >= 60 ? '⚠️ Perlu Perhatian' : 
                 '🚨 Kritikal'}

---

**Tindakan Seterusnya:**
${summary.collectionPercentage < 80 ? `
• Hantar peringatan kepada ${summary.totalUnpaid} peserta
• Follow-up dengan bendahari kumpulan
• Semak status pembayaran manual
` : '• Teruskan pemantauan rutin'}

Wassalamualaikum,

${this.config.signatureText}

**${this.config.fromName}**
${this.config.organizationName}
`;

    return { subject, body };
  }

  /**
   * Send email using Web API (client-side)
   * This opens the default email client with pre-filled content
   */
  sendEmailViaClient(to: string, template: EmailTemplate): void {
    const { subject, body } = template;
    
    // Encode email content for mailto URL
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    const mailtoUrl = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
    
    // Open email client
    window.open(mailtoUrl, '_blank');
  }

  /**
   * Send bulk emails via client
   */
  sendBulkEmailsViaClient(emails: Array<{to: string, template: EmailTemplate}>): void {
    emails.forEach(({ to, template }, index) => {
      // Add small delay to prevent overwhelming the system
      setTimeout(() => {
        this.sendEmailViaClient(to, template);
      }, index * 1000); // 1 second delay between emails
    });
  }

  /**
   * Generate reminder emails for participants with unpaid months
   */
  generateReminderEmails(
    participants: Participant[], 
    payments: Payment[]
  ): Array<{to: string, template: EmailTemplate, participant: Participant}> {
    const reminderEmails: Array<{to: string, template: EmailTemplate, participant: Participant}> = [];
    
    participants.forEach(participant => {
      if (!participant.email) return;
      
      // Find unpaid months for this participant
      const participantPayments = payments.filter(p => p.participantId === participant.id);
      const paidMonths = participantPayments.filter(p => p.isPaid).map(p => p.month);
      
      // All months from Aug 2025 to Mar 2026
      const allMonths = [
        '2025-08', '2025-09', '2025-10', '2025-11', 
        '2025-12', '2026-01', '2026-02', '2026-03'
      ];
      
      const unpaidMonths = allMonths.filter(month => !paidMonths.includes(month));
      
      if (unpaidMonths.length > 0) {
        const totalOwed = unpaidMonths.length * KORBAN_MONTHLY_AMOUNT;
        const nextDueDate = this.getNextDueDate(unpaidMonths[0]);
        
        const reminderData: EmailReminderData = {
          participant,
          unpaidMonths,
          totalOwed,
          nextDueDate
        };
        
        const template = this.generatePaymentReminderTemplate(reminderData);
        
        reminderEmails.push({
          to: participant.email,
          template,
          participant
        });
      }
    });
    
    return reminderEmails;
  }

  /**
   * Generate grouped reminder emails (merge same email addresses)
   */
  generateGroupedReminderEmails(
    participants: Participant[], 
    payments: Payment[]
  ): Array<{to: string, template: EmailTemplate, groupData: GroupedEmailData}> {
    const emailGroups = new Map<string, GroupedEmailData>();
    
    participants.forEach(participant => {
      if (!participant.email) return;
      
      // Find unpaid months for this participant
      const participantPayments = payments.filter(p => p.participantId === participant.id);
      const paidMonths = participantPayments.filter(p => p.isPaid).map(p => p.month);
      
      // All months from Aug 2025 to Mar 2026
      const allMonths = [
        '2025-08', '2025-09', '2025-10', '2025-11', 
        '2025-12', '2026-01', '2026-02', '2026-03'
      ];
      
      const unpaidMonths = allMonths.filter(month => !paidMonths.includes(month));
      
      if (unpaidMonths.length > 0) {
        const totalOwed = unpaidMonths.length * KORBAN_MONTHLY_AMOUNT;
        const email = participant.email.toLowerCase().trim();
        
        if (!emailGroups.has(email)) {
          emailGroups.set(email, {
            email: participant.email, // Keep original case
            participants: [],
            combinedTotalOwed: 0,
            familyCount: 0
          });
        }
        
        const group = emailGroups.get(email)!;
        group.participants.push({
          participant,
          unpaidMonths,
          totalOwed
        });
        group.combinedTotalOwed += totalOwed;
        group.familyCount = group.participants.length;
      }
    });
    
    // Generate emails for each group
    const groupedEmails: Array<{to: string, template: EmailTemplate, groupData: GroupedEmailData}> = [];
    
    emailGroups.forEach((groupData) => {
      const template = groupData.familyCount === 1 
        ? this.generatePaymentReminderTemplate({
            participant: groupData.participants[0].participant,
            unpaidMonths: groupData.participants[0].unpaidMonths,
            totalOwed: groupData.participants[0].totalOwed,
            nextDueDate: this.getNextDueDate(groupData.participants[0].unpaidMonths[0])
          })
        : this.generateGroupedPaymentReminderTemplate(groupData);
      
      groupedEmails.push({
        to: groupData.email,
        template,
        groupData
      });
    });
    
    return groupedEmails;
  }

  /**
   * Get sacrifice type label in Malay
   */
  private getSacrificeTypeLabel(type: string): string {
    switch (type) {
      case 'korban_sunat': return 'Korban Sunat';
      case 'korban_nazar': return 'Korban Nazar'; 
      case 'aqiqah': return 'Aqiqah';
      default: return 'Korban';
    }
  }

  /**
   * Get next due date based on month
   */
  private getNextDueDate(month: string): string {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 15); // 15th of month
    return date.toLocaleDateString('ms-MY', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Validate email address
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get participants with missing email addresses
   */
  getParticipantsWithoutEmail(participants: Participant[]): Participant[] {
    return participants.filter(p => !p.email || !this.validateEmail(p.email));
  }

  /**
   * Generate email statistics
   */
  generateEmailStats(participants: Participant[]): {
    totalParticipants: number;
    withEmail: number;
    withoutEmail: number;
    validEmails: number;
    invalidEmails: number;
  } {
    const withEmail = participants.filter(p => p.email).length;
    const withoutEmail = participants.length - withEmail;
    const validEmails = participants.filter(p => p.email && this.validateEmail(p.email)).length;
    const invalidEmails = withEmail - validEmails;

    return {
      totalParticipants: participants.length,
      withEmail,
      withoutEmail,
      validEmails,
      invalidEmails
    };
  }
}

export default EmailService;