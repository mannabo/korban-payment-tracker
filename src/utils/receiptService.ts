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
  fileType?: 'image' | 'pdf'; // Track file type for proper display
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
   * Validate receipt file (images and PDF)
   */
  validateReceiptFile(file: File): { valid: boolean; error?: string } {
    // Check file type - now supports PDF
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Format fail tidak disokong. Gunakan JPEG, PNG, WebP, atau PDF sahaja.'
      };
    }

    // Check file size - PDF can be larger than images
    const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for PDF, 5MB for images
    if (file.size > maxSize) {
      const maxSizeText = file.type === 'application/pdf' ? '10MB' : '5MB';
      return {
        valid: false,
        error: `Saiz fail terlalu besar. Maksimum ${maxSizeText}.`
      };
    }

    return { valid: true };
  }

  /**
   * Compress image before upload (PDF files are not compressed)
   */
  async compressFile(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    // Don't compress PDF files
    if (file.type === 'application/pdf') {
      return file;
    }
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
   * Upload receipt file to Firebase Storage
   */
  async uploadReceiptFile(
    participantId: string,
    month: string,
    file: File
  ): Promise<string> {
    try {
      // Validate file
      const validation = this.validateReceiptFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Compress file (images only, PDF unchanged)
      const processedFile = await this.compressFile(file);
      
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
      const snapshot = await uploadBytes(storageRef, processedFile, metadata);
      
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
   * Get file type from URL or content type
   */
  getFileType(fileUrl: string, contentType?: string): 'image' | 'pdf' {
    if (contentType?.includes('pdf') || fileUrl.toLowerCase().includes('.pdf')) {
      return 'pdf';
    }
    return 'image';
  }

  /**
   * Submit receipt for approval
   */
  async submitReceiptForApproval(receiptData: Omit<ReceiptUpload, 'id' | 'uploadDate' | 'status' | 'fileType'>, originalFile?: File): Promise<string> {
    try {
      const fileType = originalFile ? this.getFileType(receiptData.receiptImageUrl, originalFile.type) : 'image';
      
      const receiptUpload: Omit<ReceiptUpload, 'id'> = {
        ...receiptData,
        uploadDate: new Date(),
        status: 'pending',
        fileType
      };

      // Remove undefined fields to prevent Firestore errors
      const cleanedData = Object.fromEntries(
        Object.entries({
          ...receiptUpload,
          uploadDate: serverTimestamp()
        }).filter(([, value]) => value !== undefined)
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
   * Check if file content is valid before upload
   */
  async validateFileContent(file: File): Promise<{ valid: boolean; error?: string }> {
    // For PDF files, basic validation only
    if (file.type === 'application/pdf') {
      // Check if it's a real PDF by looking at file header
      const arrayBuffer = await file.slice(0, 8).arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const header = String.fromCharCode(...uint8Array.slice(0, 4));
      
      if (header !== '%PDF') {
        return {
          valid: false,
          error: 'Fail PDF tidak sah atau rosak.'
        };
      }
      
      return { valid: true };
    }
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
   * Create thumbnail for preview (images only)
   */
  async createThumbnail(file: File, size: number = 150): Promise<string> {
    // For PDF files, return a PDF icon placeholder
    if (file.type === 'application/pdf') {
      // Return a base64 encoded PDF icon or placeholder
      return 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14,2 L6,2 C4.9,2 4,2.9 4,4 L4,20 C4,21.1 4.9,22 6,22 L18,22 C19.1,22 20,21.1 20,20 L20,8 L14,2 Z"/>
          <polyline points="14,2 14,8 20,8"/>
          <text x="12" y="15" text-anchor="middle" fill="red" font-size="6" font-weight="bold">PDF</text>
        </svg>
      `);
    }
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