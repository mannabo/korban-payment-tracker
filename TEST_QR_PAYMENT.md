# QR Payment Testing Checklist

## Test Environment
- Development server: http://localhost:5175/
- Date: 2025-07-22
- Features: Custom amount, QR download, BSN bank details

## Test Cases

### ✅ Modal Display Test
- [ ] Click "Bayar QR" button on unpaid month
- [ ] Modal opens with QR code visible
- [ ] QR image loads from /public/qr-code-masjid.png
- [ ] Modal is responsive on mobile/desktop

### ✅ Bank Details Test  
- [ ] Bank name shows: "Bank Simpanan Nasional (BSN)"
- [ ] Account name shows: "Masjid Al-Falah Kampung Hang Tuah"
- [ ] Account number shows: "0410041000004137" (no spaces)
- [ ] Copy button works and copies correct number

### ✅ Custom Amount Test
- [ ] Default amount is RM100.00
- [ ] Quick buttons work: 1 Bulan (RM100), 2 Bulan (RM200), etc.
- [ ] Manual input field accepts numbers
- [ ] Amount updates in display section
- [ ] Amount updates in instructions ("Pastikan jumlah adalah RM X")

### ✅ Reference Number Test
- [ ] Reference format: KPP[Last4Digits]-[YYYYMM]
- [ ] Copy reference button works
- [ ] Reference shows in instructions

### ✅ QR Download Test
- [ ] "Muat Turun QR Code" button works
- [ ] Downloads file: "QR-Masjid-Al-Falah-Korban-2026.png"
- [ ] Downloaded file is the correct QR image

### ✅ Instructions Test
- [ ] Step-by-step instructions in Bahasa Malaysia
- [ ] Banking apps listed: BSN Go, Maybank2u, CIMB Clicks, etc.
- [ ] Custom amount reflected in instructions
- [ ] Reference number shown correctly

### ✅ Mobile Responsive Test
- [ ] Modal fits mobile screen (375px)
- [ ] Buttons are touch-friendly
- [ ] Text is readable on mobile
- [ ] QR code is appropriately sized

### ✅ Error Handling Test
- [ ] QR image fallback works if image fails to load
- [ ] Copy functionality handles errors gracefully
- [ ] Input validation prevents negative numbers

## Test Data Needed
- Participant ID (for reference generation)
- Month selection (for reference format)
- Mobile device or browser dev tools

## Expected Results
- Smooth user experience
- All copy functions work
- QR download successful
- Responsive design
- Proper BSN bank details display