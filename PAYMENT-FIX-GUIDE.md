# 🔧 Fix Suspicious Payment Amount

**Issue:** Payment ID `OqK0tVFNkqISC3bAi14N` has amount RM200 (should be RM100)

## Quick Fix Steps

### Method 1: Using Admin Panel Data Correction Tool

1. **Login ke Admin Panel:**
   - Go to https://korbanperdana.jpkkhangtuah.com
   - Click "👤 Admin Login"
   - Login dengan admin credentials

2. **Navigate to Data Correction:**
   - Go to **Settings** → **Data Correction**
   - Look for "Fix Payment Amounts" section

3. **Fix the Payment:**
   - Find payment ID: `OqK0tVFNkqISC3bAi14N`
   - Change amount from RM200 → RM100
   - Add note: "Corrected suspicious amount"

### Method 2: Manual Firebase Console

1. **Firebase Console:**
   - Go to https://console.firebase.google.com
   - Select project: korban-payment-tracker
   - Go to **Firestore Database**

2. **Find Payment:**
   - Collection: `payments`
   - Document ID: `OqK0tVFNkqISC3bAi14N`

3. **Edit Fields:**
   - `amount`: Change 200 → 100
   - `notes`: Add "Amount corrected from RM200"

### Method 3: Browser Console Script

1. **Open Admin Panel:**
   - Login ke https://korbanperdana.jpkkhangtuah.com
   - Open browser console (F12)

2. **Run Script:**
```javascript
// Fix suspicious payment via browser console
const fixPayment = async () => {
  const paymentRef = firebase.firestore().collection('payments').doc('OqK0tVFNkqISC3bAi14N');
  
  try {
    await paymentRef.update({
      amount: 100,
      notes: 'Amount corrected from RM200 to RM100 - automated fix'
    });
    console.log('✅ Payment amount corrected successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

fixPayment();
```

## 📊 Expected Result

After fix:
- Console error will disappear
- Data diagnostics will show 0 suspicious amounts
- Payment amount will be RM100 (standard amount)

## 🔍 Verify Fix

Check console in admin panel - should see:
```
✅ No data issues detected
```

Instead of:
```
🚨 DATA ISSUES DETECTED: suspiciousAmounts: Array(1)
```