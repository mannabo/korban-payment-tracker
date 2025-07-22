# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks
- **IMPORTANT**: Always run `npm run lint` after making code changes before committing

### Deployment Process ⭐ IMPORTANT ⭐
- **Hosting Provider**: Hostinger (NOT Firebase!)
- **Domain**: korbanperdana.jpkkhangtuah.com
- **Repository**: GitHub (mannabo/korban-payment-tracker)
- **Auto-Deployment**: GitHub → Hostinger integration
- **Deploy Command**: `git add . && git commit -m "message" && git push origin master`
- **Deployment Time**: 2-5 minutes after git push
- **DO NOT USE**: `firebase deploy` (Firebase config exists but not used for hosting)
- **Build Output**: `dist/` directory (for reference only, auto-deployed from GitHub)

### Firebase Configuration (Backend Only)
- Firebase Firestore for database
- Firebase Auth for authentication  
- Firebase Storage for file uploads
- `firebase.json` configured but hosting NOT used (use Hostinger instead)

## Architecture Overview

### Application Structure
This is a **React + TypeScript + Firebase** web application for managing korban (Islamic sacrifice) payment tracking with dual interfaces:

1. **Public Portal** - Participant payment tracking and lookup
2. **Admin Panel** - Complete management dashboard for groups, participants, and payments

### Authentication & Authorization
- **Firebase Auth** integration with role-based access control
- **AuthContext** (`src/contexts/AuthContext.tsx`) manages auth state
- **User Roles**: `admin` | `participant` with different UI flows
- **AutoLogin** flow in main App.tsx routes users based on authentication status

### Data Layer (Firebase Firestore)
**Core Collections:**
- `groups` - Group management with participant organization
- `participants` - Individual participant records with sacrifice type selection
- `payments` - Monthly payment tracking (RM100/month � 8 months = RM800 total)
- `participantCredits` - Advanced credit system for prepaid balances and transaction history
- `userRoles` - User authentication to participant/admin mapping
- `participantChangeRequests` - Approval workflow for participant data changes
- `auditLogs` - Change tracking and audit trail

**Key Data Patterns:**
- Real-time subscriptions using `onSnapshot` for live updates
- Payment tracking by month (format: "2025-08" to "2026-03")
- Sacrifice type pricing: All types default to RM100/month (korban_sunat, korban_nazar, aqiqah)

### Core Business Logic

**Payment Calculation:**
- **Monthly Amount**: RM100 per participant per month
- **Total Expected**: RM800 per participant (8 months: Aug 2025 - Mar 2026)
- **Progress Tracking**: Real-time calculation of paid vs. unpaid amounts
- **IMPORTANT**: Use `KORBAN_MONTHLY_AMOUNT` (RM100) for monthly operations, `KORBAN_PRICE_PER_PARTICIPANT` (RM800) for totals

**Change Request Workflow:**
- Participants can request changes to their details via public portal
- Admin approval required for name, phone, email, and sacrifice type changes
- Audit logging for all changes with full traceability

### Component Architecture

**Page Components** (`src/pages/`):
- `PaymentTracking.tsx` - Main admin payment management interface
- `Dashboard.tsx` - Admin overview with statistics
- `GroupManagement.tsx` - CRUD operations for groups and participants
- `ParticipantDashboard.tsx` - Authenticated participant view
- `StyledPublicPortal.tsx` - Public interface for participant lookup

**Key Shared Components** (`src/components/`):
- `PublicParticipantDashboard.tsx` - Participant progress view with credit system integration
- `ReceiptManagement.tsx` - Advanced receipt approval with credit auto-conversion
- `GroupProgressView.tsx` - Group-level payment visualization
- `ChangeRequestManagement.tsx` - Admin interface for approving participant changes
- `ParticipantLookup.tsx` - Name-based participant search

**Credit System Services** (`src/utils/`):
- `creditService.ts` - Complete credit lifecycle management with auto-conversion logic
- `firestore.ts` - Database operations including credit transactions

### State Management Patterns
- **React Context** for authentication state
- **Real-time Firebase subscriptions** for data synchronization
- **Local component state** for UI interactions
- **useResponsive hook** for mobile-first responsive design

### Export & Reporting
- **Excel export functionality** (`src/utils/exportUtils.ts`)
- Multiple report types: current view, group summaries, monthly summaries, detailed reports
- Uses `xlsx` library for spreadsheet generation

### Code Conventions
- **TypeScript interfaces** in `src/types/index.ts` define all data structures
- **Firestore utilities** in `src/utils/firestore.ts` for all database operations
- **Consistent naming**: Use Malaysian/Malay terms in UI (e.g., "Peserta", "Kumpulan")
- **Payment calculations**: Always use monthly constants, not hardcoded values
- **Import organization**: Follow existing patterns - React/external imports first, then local imports
- **Component structure**: Functional components with TypeScript, hooks pattern throughout
- **Error handling**: Always include try-catch blocks for Firebase operations

### Firebase Security
- Firestore security rules configured (`firestore.rules`)
- Role-based access control with separate read/write permissions for admin vs participant data
- Public read access for participant lookup functionality

### Development Notes
- **Mobile-first responsive design** using Tailwind CSS v4
- **Real-time updates** throughout the application via Firebase subscriptions
- **Defensive error handling** with fallbacks for permission-denied scenarios
- **Audit trail** for all data modifications with user attribution

### Testing and Quality Assurance
- **Manual testing** required for all payment-related features
- **Cross-browser testing** on mobile devices essential for public portal
- **Data validation** must be thorough for payment amounts and participant information
- **Firebase security rules** should be tested with different user roles

### Payment Formula Migration Notes
Recent change: Monthly payment amount changed from RM800 to RM100 per month. When working on payment-related features:
- Individual monthly payments: RM100
- Total participant cost: RM800 (RM100 � 8 months)
- Update both admin payment creation and participant progress calculations
- Verify export utilities use correct monthly amounts

## Recent Completed Tasks (2025-01-20)

### Security Enhancements ✅ COMPLETED
- **Admin Registration Security**: Implemented secure admin account creation system
  - Removed signup capability from admin login form (`src/components/LoginForm.tsx`)
  - Created admin management utilities (`src/utils/adminUtils.ts`)
  - Built AdminManagement component for existing admins only (`src/components/AdminManagement.tsx`)
  - Integrated into Settings page with tab-based navigation (`src/pages/Settings.tsx`)
  - Added security warnings and user education
  - **Result**: Only existing administrators can create new admin accounts

### User Experience Improvements ✅ COMPLETED
- **FAQ Section**: Added comprehensive FAQ section to main page (`src/pages/StyledPublicPortal.tsx`)
  - 15 detailed questions covering all program aspects
  - Collapsible/expandable interface for better UX
  - Half-width responsive design (800px max)
  - Contact information: Noor Azman bin Omar (014-6168216)
  - Email: masjid.hangtuahsagil@gmail.com
  - **Result**: Users can easily find answers to common questions

### Content Updates ✅ COMPLETED
- **Program Branding**: Updated header to "Program Korban Perdana Hari Raya Haji 2026"
- **Contact Information**: Updated phone (+6014-6168216/+6016-9038867) and email

## PHASE 7 COMPLETED (2025-01-21) ✅ FULLY IMPLEMENTED

### FREE Automated Features Implementation ✅ COMPLETED
- **📧 Automated Email Payment Reminders System**: Fully functional client-side email system
  - Email service with Malay language templates (`src/utils/emailService.ts`)
  - Payment reminder system with grouping for families (`src/components/PaymentReminderSystem.tsx`)
  - Admin email configuration interface (`src/components/EmailSettings.tsx`)
  - Email grouping to reduce duplicate emails for same email addresses
  - Monthly payment status detection and overdue reminders
  - **Result**: Admin can generate and send payment reminders without monthly costs

- **📱 Self-Service Receipt Upload Functionality**: Complete anonymous upload system
  - Receipt upload component with image validation (`src/components/ReceiptUpload.tsx`)
  - Receipt service with compression and validation (`src/utils/receiptService.ts`)
  - Firebase Storage integration with proper security rules
  - Anonymous upload capability (no login required - consistent with edit participant feature)
  - Comprehensive error handling and troubleshooting guides (`src/components/UploadTroubleshooting.tsx`)
  - **Result**: Participants can upload payment receipts directly from public portal

- **🔐 Firebase Security & Infrastructure**: Production-ready setup
  - Firebase Storage bucket configuration and deployment
  - Storage security rules allowing anonymous uploads with validation (`storage.rules`)
  - Firestore rules for receipt submissions (`firestore.rules`)
  - CORS issues resolved and proper error handling implemented
  - **Result**: Secure, scalable infrastructure for receipt uploads

- **⚖️ Admin Receipt Management System**: Complete approval workflow
  - Receipt management component with real-time updates (`src/components/ReceiptManagement.tsx`)
  - Bulk approve/reject functionality with reasons
  - Receipt image preview and validation
  - Integration with existing admin dashboard
  - Filter and search capabilities for efficient management
  - **Result**: Streamlined admin workflow for receipt approval

### Technical Achievements ✅ COMPLETED
- **Anonymous Authentication**: Receipt uploads work without login requirement
- **File Processing**: Support for images (5MB limit) and PDF files (10MB limit)
- **Real-time Updates**: Firebase subscriptions for live receipt status updates
- **Error Handling**: Comprehensive error messages and troubleshooting
- **Security**: Proper validation while maintaining public access
- **Mobile Responsive**: Full mobile support for receipt uploads
- **PDF Support**: Complete PDF upload, validation, and preview functionality

## PHASE 8 COMPLETED (2025-01-22) ✅ FULLY IMPLEMENTED

### PDF Upload Support Enhancement ✅ COMPLETED
- **📄 Enhanced File Support**: Extended receipt system to accept PDF files alongside images
  - Receipt service updated (`src/utils/receiptService.ts`) with PDF validation and processing
  - File size limits: Images 5MB, PDF files 10MB
  - PDF content validation with header checking
  - PDF thumbnail generation with SVG icon placeholder
  - **Result**: Participants can now upload PDF receipts directly

- **🔍 Admin PDF Preview**: Complete PDF handling in admin management system
  - Receipt management enhanced (`src/components/ReceiptManagement.tsx`) with PDF preview
  - PDF files display with dedicated PDF icon and open-in-new-tab functionality
  - Proper file type detection and display logic
  - **Result**: Admins can efficiently review both image and PDF receipts

- **📱 Upload Interface Enhancement**: Updated receipt upload component for PDF support
  - Upload component enhanced (`src/components/ReceiptUpload.tsx`) with dual file type support
  - Visual indicators for both image and PDF file types
  - Proper file validation and preview for PDF files
  - **Result**: Intuitive upload experience for all receipt file types

### Technical Implementation ✅ COMPLETED
- **File Type Detection**: Automatic file type classification and metadata storage
- **Validation System**: Separate validation rules for images vs PDF files
- **Preview System**: Dynamic preview generation based on file type
- **Storage Integration**: Firebase Storage handles both file types seamlessly
- **Interface Updates**: TypeScript interfaces updated with fileType property
- **Error Handling**: Specific error messages for different file types and validation failures

## PHASE 9 COMPLETED (2025-01-22) ✅ FULLY IMPLEMENTED

### Advanced Credit System Implementation ✅ COMPLETED

#### **🏦 Complete Credit Management System**: Intelligent advance payment handling
- **Credit Service** (`src/utils/creditService.ts`): Full credit lifecycle management
  - Add credit from payments, use credit for monthly payments, transaction history
  - Auto-calculation of prepaid months and credit balances
  - Credit carry-forward logic for future months
- **Credit Database** (`participantCredits` collection): Real-time credit tracking
  - Individual participant credit balances with full transaction history
  - Firestore rules allowing public read for participant credit checking
  - Automatic credit balance updates with proper audit trails

#### **🎯 Multi-Month Payment Approval System**: Advanced receipt processing
- **Enhanced Receipt Management** (`src/components/ReceiptManagement.tsx`): Intelligent payment processing
  - **Amount < RM100**: Credit-only processing (no months marked as paid)
  - **Amount >= RM100**: Smart multi-month payment with credit system integration
  - **Auto-conversion**: When credit reaches RM100+, automatically marks next unpaid month
  - Detailed confirmation dialogs showing credit usage and month conversions

#### **📊 Credit System UI Integration**: Complete user experience
- **Public Portal** (`src/components/PublicParticipantDashboard.tsx`): Credit-aware participant dashboard
  - Credit balance display with prepaid months calculation
  - Payment status shows "Ditampung oleh kredit" for credit-covered months
  - Enhanced progress calculation including credit + actual payments
- **Admin Dashboard** (`src/pages/Dashboard.tsx`): Credit management overview
  - Total credit balance statistics across all participants
  - Credit summary section showing participants with credit balances
  - Prepaid months calculation and transaction counts
- **Payment Tracking** (`src/pages/PaymentTracking.tsx`): Credit-integrated payment management
  - Credit balance column showing current balance and prepaid months for each participant
  - Payment status includes credit-covered month indicators

#### **⚡ Smart Payment Processing Logic**: Intelligent credit workflows
- **Small Payments (< RM100)**: 
  - Added directly to credit balance only
  - No payment records created
  - Special confirmation dialog for credit-only processing
- **Full Payments (>= RM100)**:
  - Standard monthly payment records created
  - Excess amount added to credit balance
  - Credit system handles carry-forward logic
- **Auto-Conversion**:
  - When credit balance reaches RM100+, automatically finds next unpaid month
  - Creates payment record and deducts RM100 from credit
  - Shows detailed conversion summary to admin

### **Business Logic Examples** ✅ COMPLETED
```
Example Flow:
1. Participant pays RM240 → Marks 2 months + RM40 credit
2. Later pays RM60 → Total RM100 credit 
3. System auto-converts → Marks next month + RM0 remaining credit

Credit-Only Flow:
1. Participant pays RM40 → Only adds RM40 to credit
2. Later pays RM30 → Credit becomes RM70  
3. Later pays RM50 → Credit becomes RM120
4. System auto-converts → Marks 1 month + RM20 remaining credit
```

### **Technical Achievements** ✅ COMPLETED
- **Credit Service Architecture**: Singleton pattern with comprehensive credit management
- **Real-time Credit Updates**: Firebase subscriptions for live credit balance updates  
- **Transaction History**: Full audit trail for all credit additions and usage
- **Auto-Conversion Logic**: Intelligent credit-to-payment conversion system
- **UI Integration**: Credit information displayed across all relevant interfaces
- **Error Handling**: Robust fallbacks for credit system failures
- **Data Consistency**: Credit balances always consistent with payment records

## Next Priority Tasks

### High Priority (Data & Payment Management) - COMPLETED ✅
1. **Fix RM800 payments to RM100** using Data Correction tool ✅ COMPLETED
2. **Add bulk payment import** from Excel/CSV ✅ COMPLETED  
3. **Implement automated payment reminders** (email/SMS) ✅ COMPLETED
4. **Add participant self-service payment upload** (receipt photos) ✅ COMPLETED
5. **PDF upload support for payment receipts** ✅ COMPLETED

### UI Consistency Fixes - JULY 2025 ✅ COMPLETED
6. **Fixed "Ditampung oleh kredit" UI inconsistency** ✅ COMPLETED (July 22, 2025)
   - Removed outdated "covered by credit" status display from participant dashboard
   - Updated PaymentTracking to show only "Sudah Bayar" or "Belum Bayar" statuses  
   - Aligned UI with auto-conversion business logic documented in Phase 9
   - **Result**: UI now correctly reflects that credits auto-convert to payment records

7. **Receipt Upload History & Status Tracking** ✅ COMPLETED (July 22, 2025)
   - Added comprehensive receipt submission history in participant dashboard
   - Real-time status updates showing "Menunggu Kelulusan", "Diluluskan", or "Ditolak"
   - Detailed approval/rejection information with timestamps and reasons
   - Visual status indicators with color-coded cards for easy recognition
   - File type detection (PDF/Image) with appropriate icons
   - **Result**: Participants can now track their receipt submissions and approval status

8. **Mobile Responsive Admin Login Button** ✅ COMPLETED (July 22, 2025)
   - Redesigned admin login button with improved mobile layout and responsiveness
   - Added responsive breakpoints (mobile: <768px, small mobile: <400px)
   - Implemented clamp() CSS functions for scalable dimensions across all screen sizes
   - Enhanced visual design with better shadows, hover effects, and touch-friendly interactions
   - Button now adapts text display based on screen size (icon-only on very small screens)
   - Fixed positioning issues that caused broken appearance ("cacat") on mobile devices
   - **Result**: Professional, responsive admin access button that works seamlessly across all devices

9. **WhatsApp Link Sharing & Open Graph Optimization** ✅ COMPLETED (July 22, 2025)
   - Added comprehensive Open Graph meta tags for WhatsApp, Facebook, and Twitter sharing
   - Configured banner-korban.jpg (1200x600) as the primary social media image
   - Updated meta descriptions, titles, and image specifications for optimal sharing
   - Added WhatsApp-specific meta tags and Schema.org microdata for better compatibility
   - Enhanced SEO with canonical URLs, theme color, robots meta, and favicon configuration
   - **Result**: Professional link previews in WhatsApp showing KORBAN PERDANA banner with JPKK branding

## SUGGESTED NEXT PHASES

### PHASE 10 - Analytics & Reporting Dashboard (RECOMMENDED) 📊
**Priority**: High - Data-driven decision making for program management

**Core Features:**
- **Payment Analytics Dashboard**: Visual charts showing payment trends, monthly collection rates, and progress tracking
- **Group Performance Comparison**: Interactive charts comparing payment completion across different groups
- **Outstanding Payment Reports**: Automated reports highlighting overdue payments and at-risk participants
- **Progress Distribution Analysis**: Visual breakdown of participant payment status distribution
- **Monthly/Weekly Summary Reports**: Automated report generation for committee meetings

**Implementation Scope:**
- Chart.js/Recharts integration for interactive visualizations
- Real-time data visualization with Firebase subscriptions
- Export functionality for reports (PDF, Excel)
- Mobile-responsive dashboard for tablet/phone access
- Administrative insights for program optimization

**Business Impact:**
- Enable data-driven program management decisions
- Quick identification of payment collection issues
- Visual progress reports for stakeholder presentations
- Early warning system for payment delays

---

### PHASE 11 - Enhanced Receipt Management (ALTERNATIVE) 📄
**Priority**: High - Operational efficiency improvement

**Core Features:**
- **Auto-Payment Creation**: Automatic payment record generation from approved receipts
- **Receipt Notifications**: WhatsApp/Email alerts when receipts are uploaded or processed
- **Receipt Analytics**: Monthly receipt processing reports and statistics  
- **Advanced Receipt Search**: Filter by date range, amount, approval status, participant
- **Batch Receipt Processing**: Bulk approve/reject capabilities with reasons

**Implementation Scope:**
- Workflow automation for receipt-to-payment conversion
- Notification system integration (email/WhatsApp API)
- Advanced filtering and search capabilities
- Receipt processing analytics and reporting
- Improved admin workflow efficiency

**Business Impact:**
- Reduce manual payment entry workload
- Faster receipt processing and participant feedback
- Improved receipt processing transparency
- Enhanced operational efficiency

---

### PHASE 12 - Role-Based Access Control (FUTURE) 👥
**Priority**: Medium - Advanced security and delegation

**Features**: Multi-level admin permissions (treasurer, viewer, manager), delegation workflows, audit logging

---

### PHASE 13 - Communication Integration (FUTURE) 📱
**Priority**: Medium - Direct participant communication

**Features**: WhatsApp payment reminders, QR code generation, automated notifications