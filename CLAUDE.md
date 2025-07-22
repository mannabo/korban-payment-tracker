# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

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
- `PublicParticipantDashboard.tsx` - Participant progress view (used in both public and authenticated flows)
- `GroupProgressView.tsx` - Group-level payment visualization
- `ChangeRequestManagement.tsx` - Admin interface for approving participant changes
- `ParticipantLookup.tsx` - Name-based participant search

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

### Firebase Security
- Firestore security rules configured (`firestore.rules`)
- Role-based access control with separate read/write permissions for admin vs participant data
- Public read access for participant lookup functionality

### Development Notes
- **Mobile-first responsive design** using Tailwind CSS v4
- **Real-time updates** throughout the application via Firebase subscriptions
- **Defensive error handling** with fallbacks for permission-denied scenarios
- **Audit trail** for all data modifications with user attribution

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

## Next Priority Tasks

### High Priority (Data & Payment Management) - COMPLETED ✅
1. **Fix RM800 payments to RM100** using Data Correction tool ✅ COMPLETED
2. **Add bulk payment import** from Excel/CSV ✅ COMPLETED  
3. **Implement automated payment reminders** (email/SMS) ✅ COMPLETED
4. **Add participant self-service payment upload** (receipt photos) ✅ COMPLETED
5. **PDF upload support for payment receipts** ✅ COMPLETED

### Medium Priority (Management Features) - NEXT PHASE
6. Create comprehensive reporting dashboard with charts
7. Add payment history tracking and audit logs
8. Implement role-based permissions (admin/treasurer/viewer)
9. Add WhatsApp integration for payment notifications
10. Create participant QR codes for easy payment tracking
11. Implement receipt-to-payment auto-creation workflow
12. Add receipt upload notifications for admins
13. Create monthly/yearly receipt reports and analytics