# 🔧 Fix RM350 Multi-Month Payment Issue

**Problem:** RM350 payment split to 3×RM117 instead of proper calculation.

## 💡 **Fixed Logic:**
- **RM350 payment** → 3 months
- **Month 1**: RM150 (RM100 + RM50 excess)  
- **Month 2**: RM100 (standard)
- **Month 3**: RM100 (standard)
- **Total**: RM350 ✅

## 🔧 **Fix Existing Data - Browser Console:**

### Step 1: Update First Payment (add excess amount)
```javascript
// Fix payment ID: kyL1yNerAZzbucZ8aDq9 (2025-08) 
firebase.firestore().collection('payments').doc('kyL1yNerAZzbucZ8aDq9').update({
  amount: 150,
  notes: 'Multi-month payment - Month 1 of 3 (RM350 total, excess RM50 added here)'
});
```

### Step 2: Fix Second Payment (standard RM100)
```javascript
// Fix payment ID: 0Ypn2ctwB2OA636xpvJA (2025-09)
firebase.firestore().collection('payments').doc('0Ypn2ctwB2OA636xpvJA').update({
  amount: 100,
  notes: 'Multi-month payment - Month 2 of 3 (RM350 total)'
});
```

### Step 3: Fix Third Payment (standard RM100)  
```javascript
// Fix payment ID: LtxAua5HvcHFyCgMBhKN (2025-10)
firebase.firestore().collection('payments').doc('LtxAua5HvcHFyCgMBhKN').update({
  amount: 100,
  notes: 'Multi-month payment - Month 3 of 3 (RM350 total)'
});
```

### Step 4: Refresh and Verify
```javascript
// Reload page to see changes
location.reload();
```

## 🎯 **Expected Result:**
- ✅ **Payment 1 (Aug)**: RM150 (includes RM50 excess)
- ✅ **Payment 2 (Sep)**: RM100 (standard)  
- ✅ **Payment 3 (Oct)**: RM100 (standard)
- ✅ **Total**: RM350 (matches receipt amount)
- ✅ **Data warning**: Will disappear

## 🚀 **New System Behavior:**
For future RM350 payments:
- **Month 1**: RM150 (RM100 + RM50 excess)
- **Month 2**: RM100 (standard) 
- **Month 3**: RM100 (standard)

For RM280 payments (2.8 months):
- **Month 1**: RM180 (RM100 + RM80 excess)  
- **Month 2**: RM100 (standard)

This keeps individual payments close to RM100 standard while handling excess properly!