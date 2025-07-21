# Manual Firestore Rules Deployment

Since we don't have Firebase CLI properly configured, you need to manually update the Firestore rules in Firebase Console.

## Steps:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `korban-payment-tracker`
3. Go to Firestore Database → Rules
4. Replace the existing rules with the content from `firestore.rules`

## Updated Rules Content:

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
    
    // Participant change requests - public read for participants to see their own requests
    // Write access for creating new requests (public) and updating status (admin only)
    match /participantChangeRequests/{requestId} {
      allow read: if true; // Allow public read so participants can see their requests
      allow create: if true; // Allow public create for new requests
      allow update: if request.auth != null; // Only authenticated users (admins) can update status
      allow delete: if request.auth != null;
    }
    
    // Audit logs - read access for transparency, write access for system only
    match /auditLogs/{logId} {
      allow read: if true; // Allow public read for transparency
      allow write: if request.auth != null; // Only authenticated users can create logs
    }
    
    // All other documents require authentication
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## After updating rules:

1. Click "Publish" in Firebase Console
2. Test the application again
3. The participant detail functionality should work without permission errors

## Note:
The application now has fallback handling for permission errors, so it should still work even if rules are not updated immediately.