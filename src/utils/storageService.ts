import { getStorage, ref, listAll, getMetadata, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface StorageUsage {
  totalSizeBytes: number;
  totalFiles: number;
  receiptFiles: number;
  receiptSizeBytes: number;
  monthlyBreakdown: Array<{
    month: string;
    count: number;
    sizeBytes: number;
  }>;
}

export interface FileInfo {
  name: string;
  fullPath: string;
  size: number;
  timeCreated: string;
  downloadURL: string;
}

class StorageService {
  private storage = getStorage();

  // Get comprehensive storage usage statistics
  async getStorageUsage(): Promise<StorageUsage> {
    try {
      const receiptsRef = ref(this.storage, 'receipts');
      const receiptsList = await listAll(receiptsRef);
      
      let totalSizeBytes = 0;
      let receiptSizeBytes = 0;
      const monthlyBreakdown: { [month: string]: { count: number; sizeBytes: number } } = {};
      
      // Process all receipt files
      const filePromises = receiptsList.items.map(async (itemRef) => {
        try {
          const metadata = await getMetadata(itemRef);
          const size = metadata.size || 0;
          const timeCreated = metadata.timeCreated;
          
          totalSizeBytes += size;
          receiptSizeBytes += size;
          
          // Extract month from file path or timeCreated
          const createdDate = new Date(timeCreated);
          const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyBreakdown[monthKey]) {
            monthlyBreakdown[monthKey] = { count: 0, sizeBytes: 0 };
          }
          
          monthlyBreakdown[monthKey].count++;
          monthlyBreakdown[monthKey].sizeBytes += size;
          
          return { name: itemRef.name, size, timeCreated };
        } catch (error) {
          console.warn(`Error processing file ${itemRef.name}:`, error);
          return null;
        }
      });
      
      await Promise.all(filePromises);
      
      // Convert monthly breakdown to array
      const monthlyArray = Object.entries(monthlyBreakdown)
        .map(([month, data]) => ({
          month,
          count: data.count,
          sizeBytes: data.sizeBytes
        }))
        .sort((a, b) => b.month.localeCompare(a.month)); // Newest first
      
      return {
        totalSizeBytes,
        totalFiles: receiptsList.items.length,
        receiptFiles: receiptsList.items.length,
        receiptSizeBytes,
        monthlyBreakdown: monthlyArray
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      throw new Error('Failed to fetch storage usage');
    }
  }

  // Get files for a specific month
  async getFilesByMonth(month: string): Promise<FileInfo[]> {
    try {
      const receiptsRef = ref(this.storage, 'receipts');
      const receiptsList = await listAll(receiptsRef);
      
      const files: FileInfo[] = [];
      const targetYear = parseInt(month.split('-')[0]);
      const targetMonth = parseInt(month.split('-')[1]);
      
      const filePromises = receiptsList.items.map(async (itemRef) => {
        try {
          const metadata = await getMetadata(itemRef);
          const createdDate = new Date(metadata.timeCreated);
          
          // Check if file belongs to target month
          if (createdDate.getFullYear() === targetYear && 
              (createdDate.getMonth() + 1) === targetMonth) {
            
            const downloadURL = await getDownloadURL(itemRef);
            
            files.push({
              name: itemRef.name,
              fullPath: itemRef.fullPath,
              size: metadata.size || 0,
              timeCreated: metadata.timeCreated,
              downloadURL
            });
          }
        } catch (error) {
          console.warn(`Error processing file ${itemRef.name}:`, error);
        }
      });
      
      await Promise.all(filePromises);
      
      return files.sort((a, b) => new Date(b.timeCreated).getTime() - new Date(a.timeCreated).getTime());
    } catch (error) {
      console.error('Error getting files by month:', error);
      throw new Error('Failed to fetch files for the specified month');
    }
  }

  // Download files as ZIP for a specific month
  async downloadMonthlyZip(month: string, onProgress?: (progress: number) => void): Promise<void> {
    try {
      const files = await this.getFilesByMonth(month);
      
      if (files.length === 0) {
        throw new Error('No files found for the specified month');
      }
      
      const zip = new JSZip();
      let completed = 0;
      
      // Download each file and add to ZIP
      const downloadPromises = files.map(async (file) => {
        try {
          const response = await fetch(file.downloadURL);
          const blob = await response.blob();
          
          // Create folder structure: receipts/YYYY-MM/filename
          const folderPath = `receipts/${month}/${file.name}`;
          zip.file(folderPath, blob);
          
          completed++;
          if (onProgress) {
            onProgress((completed / files.length) * 100);
          }
        } catch (error) {
          console.warn(`Failed to download file ${file.name}:`, error);
        }
      });
      
      await Promise.all(downloadPromises);
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Download ZIP file
      const fileName = `receipts-${month}.zip`;
      saveAs(zipBlob, fileName);
      
    } catch (error) {
      console.error('Error creating monthly ZIP:', error);
      throw new Error('Failed to create ZIP file');
    }
  }

  // Clean up old rejected receipts
  async cleanupOldRejectedReceipts(daysOld: number = 30): Promise<number> {
    try {
      // Get rejected receipt submissions
      const receiptsQuery = query(
        collection(db, 'receiptSubmissions'),
        where('status', '==', 'rejected')
      );
      
      const querySnapshot = await getDocs(receiptsQuery);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      let deletedCount = 0;
      const deletePromises: Promise<void>[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const rejectedAt = data.reviewedAt?.toDate();
        
        if (rejectedAt && rejectedAt < cutoffDate && data.filePath) {
          // Delete from storage
          const fileRef = ref(this.storage, data.filePath);
          deletePromises.push(
            deleteObject(fileRef)
              .then(() => {
                deletedCount++;
                console.log(`Deleted old rejected file: ${data.filePath}`);
              })
              .catch((error) => {
                console.warn(`Failed to delete file ${data.filePath}:`, error);
              })
          );
        }
      });
      
      await Promise.all(deletePromises);
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      throw new Error('Failed to cleanup old files');
    }
  }

  // Get storage usage alerts
  getStorageAlerts(usage: StorageUsage): Array<{type: 'warning' | 'critical' | 'info', message: string}> {
    const alerts: Array<{type: 'warning' | 'critical' | 'info', message: string}> = [];
    const FREE_TIER_BYTES = 5 * 1024 * 1024 * 1024; // 5GB
    const usagePercentage = (usage.totalSizeBytes / FREE_TIER_BYTES) * 100;
    
    if (usagePercentage >= 95) {
      alerts.push({
        type: 'critical',
        message: 'Storage hampir penuh! Sila backup dan cleanup segera untuk mengelakkan kehilangan data.'
      });
    } else if (usagePercentage >= 80) {
      alerts.push({
        type: 'warning',
        message: 'Storage usage melebihi 80%. Pertimbangkan untuk backup dan cleanup.'
      });
    }
    
    if (usage.receiptFiles > 1000) {
      alerts.push({
        type: 'info',
        message: `Anda mempunyai ${usage.receiptFiles} receipt files. Pertimbangkan untuk archive files lama.`
      });
    }
    
    return alerts;
  }

  // Export storage statistics
  exportStorageStats(usage: StorageUsage): string {
    const stats = {
      generatedAt: new Date().toISOString(),
      totalSize: this.formatBytes(usage.totalSizeBytes),
      totalFiles: usage.totalFiles,
      receiptFiles: usage.receiptFiles,
      receiptSize: this.formatBytes(usage.receiptSizeBytes),
      monthlyBreakdown: usage.monthlyBreakdown.map(month => ({
        month: month.month,
        fileCount: month.count,
        size: this.formatBytes(month.sizeBytes)
      }))
    };
    
    return JSON.stringify(stats, null, 2);
  }

  // Helper method to format bytes
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const storageService = new StorageService();