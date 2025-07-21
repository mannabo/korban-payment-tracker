# Setup Demo Data - Manual Steps

## Step 1: Update Firebase Rules

1. Pergi ke [Firebase Console](https://console.firebase.google.com)
2. Pilih projek `korban-payment-tracker`
3. Klik **Firestore Database** → **Rules**
4. Replace dengan rules ini:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow public read access to participants for search functionality
    match /participants/{participantId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow public read access to groups for search filtering
    match /groups/{groupId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow public read access to payments for progress indicators
    // But keep write access restricted to authenticated users
    match /payments/{paymentId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // User roles - only for authenticated users
    match /userRoles/{roleId} {
      allow read, write: if request.auth != null;
    }
    
    // All other documents require authentication
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Klik **Publish**

## Step 2: Add Data Through Firebase Console

### Groups (Add manually):

1. Klik **Firestore Database** → **Data**
2. Klik **Start collection** → collection ID: `groups`
3. Add 10 documents:

```
Document ID: group1
{
  name: "Kumpulan 1",
  description: "Kumpulan peserta bahagian 1"
}

Document ID: group2
{
  name: "Kumpulan 2", 
  description: "Kumpulan peserta bahagian 2"
}

... (repeat for group3 to group10)
```

### Participants (Add through Console):

```
Document ID: p1
{
  name: "Ahmad Bin Ali",
  email: "ahmad@email.com", 
  phone: "012-3456789",
  groupId: "group1"
}

Document ID: p2
{
  name: "Siti Fatimah",
  email: "siti@email.com",
  phone: "012-9876543", 
  groupId: "group1"
}

... (continue with all 26 participants)
```

## Step 3: Test Current Demo Mode

After updating rules, test the application:

```bash
npm run dev
```

The application should now try to fetch real data from Firebase and fallback to demo if needed.

## Step 4: Add Payment Records (Optional)

Once participants are added, can run payment script or add manually through console.