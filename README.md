# 🕌 Korban Payment Tracker System

Sistem Tracking Pembayaran Korban Perdana untuk Masjid Al-Falah Kampung Hang Tuah.

## ✨ Features

### 🏠 Public Portal
- **Participant Lookup** - Cari nama peserta dengan mudah
- **Payment Progress** - Lihat status pembayaran bulanan
- **Receipt Upload** - Upload resit pembayaran tanpa login
- **Group Listings** - Senarai kumpulan dengan progress
- **FAQ Section** - Soalan lazim program korban

### 👤 Participant Dashboard  
- **Personal Dashboard** - Status pembayaran peribadi
- **Payment History** - Sejarah pembayaran lengkap
- **Profile Management** - Request perubahan maklumat
- **Receipt Management** - Lihat status resit yang dihantar

### 🔧 Admin Management
- **Dashboard Analytics** - Overview statistik pembayaran
- **Group Management** - CRUD operations untuk kumpulan
- **Payment Tracking** - Track pembayaran semua peserta
- **Receipt Management** - Approve/reject resit dengan bulk operations
- **Email Reminders** - Sistema automated payment reminders
- **Data Diagnostics** - Tools untuk data integrity
- **Bulk Import** - Import payments dari Excel/CSV
- **Settings & Config** - Email templates, admin management

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Styling**: Tailwind CSS v4 + Custom CSS
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **File Storage**: Firebase Storage
- **Deployment**: GitHub Actions → Hostinger
- **Email**: EmailJS client-side service

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project setup
- Hostinger hosting (for deployment)

### Development Setup

1. **Clone & Install**
   ```bash
   git clone [your-repo-url]
   cd korban-payment-tracker
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Add your Firebase config to .env.local
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   # ... other Firebase configs
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

## 📦 Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Main page components  
├── contexts/           # React contexts (Auth)
├── hooks/              # Custom React hooks
├── types/              # TypeScript interfaces
├── utils/              # Utility functions
│   ├── firebase.ts     # Firebase configuration
│   ├── firestore.ts    # Database operations
│   └── emailService.ts # Email functionality
└── styles/             # CSS files

public/
├── .htaccess          # Apache configuration
└── ...                # Static assets
```

## 🔐 Security Features

- **Role-based Authentication** (Admin vs Participant)
- **Firebase Security Rules** for database access
- **Anonymous Upload** capability for receipts
- **Input Validation** and sanitization
- **HTTPS Enforcement** via .htaccess
- **XSS Protection** headers

## 🎯 Payment System

- **Monthly Payments**: RM100 per participant per month
- **Total Amount**: RM800 per participant (8 months)
- **Payment Period**: August 2025 - March 2026
- **Sacrifice Types**: Korban Sunat, Korban Nazar, Aqiqah
- **Real-time Progress**: Live updates via Firebase subscriptions

## 📊 Admin Features

- **Dashboard Analytics** with completion statistics
- **Export Functionality** to Excel with multiple report types
- **Email Reminders** with Malay language templates
- **Receipt Management** with image preview and bulk operations
- **Data Correction Tools** for payment amount fixes
- **Responsive Design** for mobile and tablet management

## 🚀 Deployment

Automatic deployment configured via GitHub Actions to Hostinger:

1. **Push to GitHub** → Triggers build
2. **Build Process** → Install dependencies, run tests, build project  
3. **Deploy** → Upload to Hostinger via FTP
4. **Live Website** → Changes automatically deployed

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality  
npm run lint             # ESLint checking
npm run type-check       # TypeScript checking

# Deployment
npm run deploy           # Manual deployment (if needed)
```

## 📱 Responsive Design

- **Mobile-first** approach with breakpoints
- **Touch-friendly** interfaces for mobile users
- **Adaptive layouts** for different screen sizes
- **Progressive enhancement** for older browsers

## 🌟 Key Highlights

- **Real-time Updates** via Firebase subscriptions
- **Offline Capability** through service workers
- **Email Integration** without server requirements
- **Multi-language Support** (Bahasa Malaysia primary)
- **Accessibility Features** for inclusive design
- **Performance Optimized** with code splitting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is private and proprietary to Masjid Al-Falah Kampung Hang Tuah.

## 📞 Support

For technical support or questions:
- Email: masjid.hangtuahsagil@gmail.com  
- Contact: Noor Azman bin Omar (014-6168216)

---

**🕌 Program Korban Perdana Hari Raya Haji 2026 - Masjid Al-Falah Kampung Hang Tuah**🚀 SSH deployment test
