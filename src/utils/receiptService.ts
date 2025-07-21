import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

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
}

export class ReceiptService {
  private static instance: ReceiptService;
  
  public static getInstance(): ReceiptService {
    if (!ReceiptService.instance) {
      ReceiptService.instance = new ReceiptService();
    }
    return ReceiptService.instance;
  }

  /**
   * Validate image file
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Format fail tidak disokong. Gunakan JPEG, PNG, atau WebP sahaja.'
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Saiz fail terlalu besar. Maksimum 5MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Compress image before upload
   */
  async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload receipt image to Firebase Storage
   */
  async uploadReceiptImage(
    participantId: string,
    month: string,
    file: File
  ): Promise<string> {
    try {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Compress image
      const compressedFile = await this.compressImage(file);
      
      // Create storage reference with better naming
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `receipt_${participantId}_${month}_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, `receipts/${fileName}`);

      console.log('Starting upload for:', fileName);

      // Upload file with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          'participantId': participantId,
          'month': month,
          'originalName': file.name,
          'uploadDate': new Date().toISOString()
        }
      };

      // Upload file
      const snapshot = await uploadBytes(storageRef, compressedFile, metadata);
      
      console.log('Upload successful:', snapshot.metadata.name);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('storage/unauthorized') || (error as any)?.code === 'storage/unauthorized') {
          throw new Error('Ralat kebenaran: Sila semak sambungan internet dan cuba lagi.');
        } else if (error.message.includes('storage/canceled')) {
          throw new Error('Upload dibatalkan. Sila cuba lagi.');
        } else if (error.message.includes('storage/unknown')) {
          throw new Error('Ralat tidak diketahui. Sila semak sambungan internet dan cuba lagi.');
        } else if (error.message.includes('CORS')) {
          throw new Error('Ralat sambungan. Sila cuba lagi atau hubungi admin.');
        }
      }
      
      throw new Error('Gagal memuat naik resit. Sila cuba lagi.');
    }
  }

  /**
   * Submit receipt for approval
   */
  async submitReceiptForApproval(receiptData: Omit<ReceiptUpload, 'id' | 'uploadDate' | 'status'>): Promise<string> {
    try {
      const receiptUpload: Omit<ReceiptUpload, 'id'> = {
        ...receiptData,
        uploadDate: new Date(),
        status: 'pending'
      };

      // Remove undefined fields to prevent Firestore errors
      const cleanedData = Object.fromEntries(
        Object.entries({
          ...receiptUpload,
          uploadDate: serverTimestamp()
        }).filter(([_, value]) => value !== undefined)
      );

      const docRef = await addDoc(collection(db, 'receiptUploads'), cleanedData);

      return docRef.id;
    } catch (error) {
      console.error('Error submitting receipt:', error);
      throw error;
    }
  }

  /**
   * Approve receipt and create payment
   */
  async approveReceipt(receiptId: string, approvedBy: string): Promise<void> {
    try {
      // Update receipt status
      await updateDoc(doc(db, 'receiptUploads', receiptId), {
        status: 'approved',
        approvedBy,
        approvedDate: serverTimestamp()
      });

      // Note: Payment creation would be handled separately by admin
      // They can use the existing payment creation flow
    } catch (error) {
      console.error('Error approving receipt:', error);
      throw error;
    }
  }

  /**
   * Reject receipt
   */
  async rejectReceipt(receiptId: string, rejectionReason: string, rejectedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'receiptUploads', receiptId), {
        status: 'rejected',
        rejectionReason,
        approvedBy: rejectedBy, // Using same field for who processed it
        approvedDate: serverTimestamp()
      });
    } catch (error) {
      console.error('Error rejecting receipt:', error);
      throw error;
    }
  }

  /**
   * Delete receipt image from storage
   */
  async deleteReceiptImage(imageUrl: string): Promise<void> {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting receipt image:', error);
      // Don't throw error - image might already be deleted
    }
  }

  /**
   * Generate receipt file name
   */
  generateReceiptFileName(participantName: string, month: string): string {
    const cleanName = participantName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `resit_${cleanName}_${month}_${timestamp}`;
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if image is valid before upload
   */
  async validateImageContent(file: File): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        // Check minimum dimensions
        if (img.width < 100 || img.height < 100) {
          resolve({
            valid: false,
            error: 'Gambar terlalu kecil. Minimum 100x100 piksel.'
          });
          return;
        }

        // Check maximum dimensions
        if (img.width > 5000 || img.height > 5000) {
          resolve({
            valid: false,
            error: 'Gambar terlalu besar. Maksimum 5000x5000 piksel.'
          });
          return;
        }

        resolve({ valid: true });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          valid: false,
          error: 'Fail gambar rosak atau tidak sah.'
        });
      };

      img.src = url;
    });
  }

  /**
   * Create thumbnail for preview
   */
  async createThumbnail(file: File, size: number = 150): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = size;
        canvas.height = size;

        // Calculate crop area for square thumbnail
        const minDim = Math.min(img.width, img.height);
        const x = (img.width - minDim) / 2;
        const y = (img.height - minDim) / 2;

        ctx?.drawImage(img, x, y, minDim, minDim, 0, 0, size, size);
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

export default ReceiptService;