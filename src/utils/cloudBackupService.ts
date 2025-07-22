import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import JSZip from 'jszip';

interface BackupOptions {
  includeMetadata?: boolean;
  compressionLevel?: number;
  onProgress?: (progress: number, currentFile?: string) => void;
}

interface BackupResult {
  success: boolean;
  backupSize: number;
  fileCount: number;
  backupUrl?: string;
  error?: string;
}

class CloudBackupService {
  private storage = getStorage();

  // Create a comprehensive backup of all Firebase Storage files
  async createFullBackup(options: BackupOptions = {}): Promise<BackupResult> {
    try {
      const { includeMetadata = true, compressionLevel = 6, onProgress } = options;
      
      // Get all storage files
      const allFiles = await this.getAllStorageFiles();
      
      if (allFiles.length === 0) {
        return {
          success: false,
          backupSize: 0,
          fileCount: 0,
          error: 'No files found to backup'
        };
      }

      const zip = new JSZip();
      let processedFiles = 0;
      let totalSize = 0;

      // Create backup manifest
      const manifest = {
        backupDate: new Date().toISOString(),
        fileCount: allFiles.length,
        files: [] as Array<{
          path: string;
          size: number;
          lastModified: string;
          contentType?: string;
        }>
      };

      onProgress?.(0, 'Starting backup...');

      // Process files in batches to avoid memory issues
      const batchSize = 10;
      for (let i = 0; i < allFiles.length; i += batchSize) {
        const batch = allFiles.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (fileInfo) => {
          try {
            const fileRef = ref(this.storage, fileInfo.fullPath);
            const downloadURL = await getDownloadURL(fileRef);
            const metadata = await getMetadata(fileRef);
            
            // Download file content
            const response = await fetch(downloadURL);
            const blob = await response.blob();
            
            // Add to ZIP with organized folder structure
            const folderPath = this.organizeFolderPath(fileInfo.fullPath);
            zip.file(folderPath, blob);
            
            totalSize += blob.size;
            
            // Add to manifest
            manifest.files.push({
              path: fileInfo.fullPath,
              size: metadata.size || blob.size,
              lastModified: metadata.timeCreated,
              contentType: metadata.contentType
            });
            
            processedFiles++;
            onProgress?.(
              (processedFiles / allFiles.length) * 90, // Reserve 10% for ZIP generation
              `Processing: ${fileInfo.name}`
            );
            
          } catch (error) {
            console.warn(`Failed to backup file ${fileInfo.fullPath}:`, error);
          }
        }));
      }

      // Add manifest to ZIP
      if (includeMetadata) {
        zip.file('backup-manifest.json', JSON.stringify(manifest, null, 2));
      }

      onProgress?.(95, 'Generating ZIP file...');

      // Generate ZIP blob
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: compressionLevel }
      });

      onProgress?.(100, 'Backup complete!');

      // For now, create download link (in production, would upload to cloud storage)
      const backupUrl = this.createDownloadLink(zipBlob, 'firebase-storage-backup.zip');

      return {
        success: true,
        backupSize: zipBlob.size,
        fileCount: processedFiles,
        backupUrl
      };

    } catch (error) {
      console.error('Backup failed:', error);
      return {
        success: false,
        backupSize: 0,
        fileCount: 0,
        error: error instanceof Error ? error.message : 'Unknown backup error'
      };
    }
  }

  // Get all files from Firebase Storage recursively
  private async getAllStorageFiles(): Promise<Array<{
    name: string;
    fullPath: string;
  }>> {
    const files: Array<{ name: string; fullPath: string }> = [];
    
    // Start from root
    const rootRef = ref(this.storage);
    await this.listFilesRecursively(rootRef, files);
    
    return files;
  }

  // Recursively list all files in storage
  private async listFilesRecursively(
    folderRef: any, 
    files: Array<{ name: string; fullPath: string }>
  ): Promise<void> {
    try {
      const result = await listAll(folderRef);
      
      // Add all files in current folder
      result.items.forEach(itemRef => {
        files.push({
          name: itemRef.name,
          fullPath: itemRef.fullPath
        });
      });
      
      // Recursively process subfolders
      await Promise.all(
        result.prefixes.map(folderRef => 
          this.listFilesRecursively(folderRef, files)
        )
      );
    } catch (error) {
      console.warn('Error listing folder:', error);
    }
  }

  // Organize file paths for better folder structure in backup
  private organizeFolderPath(fullPath: string): string {
    // Group files by type and date
    const pathParts = fullPath.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // Extract date from filename or use current date
    const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
    const dateFolder = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
    
    // Organize by file type
    if (fullPath.startsWith('receipts/')) {
      return `backup/receipts/${dateFolder}/${fileName}`;
    } else if (fullPath.startsWith('profiles/')) {
      return `backup/profiles/${fileName}`;
    } else {
      return `backup/misc/${fileName}`;
    }
  }

  // Create download link for backup file
  private createDownloadLink(blob: Blob, filename: string): string {
    const url = URL.createObjectURL(blob);
    
    // Auto-download the backup
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up URL object after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    return url;
  }

  // Upload backup to Google Cloud Storage (requires backend implementation)
  async uploadToGoogleCloud(backupBlob: Blob): Promise<string> {
    // This would require backend integration with Google Cloud Storage
    // For now, return mock implementation
    
    const formData = new FormData();
    formData.append('backup', backupBlob, `backup-${Date.now()}.zip`);
    
    try {
      // Mock API call - would need actual backend endpoint
      console.log('Would upload to Google Cloud Storage:', backupBlob.size, 'bytes');
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return `gs://korban-backups/backup-${Date.now()}.zip`;
    } catch (error) {
      throw new Error('Failed to upload backup to Google Cloud Storage');
    }
  }

  // Get backup history from local storage (mock implementation)
  getBackupHistory(): Array<{
    date: Date;
    size: number;
    fileCount: number;
    location: string;
  }> {
    const history = localStorage.getItem('backup-history');
    if (!history) return [];
    
    try {
      return JSON.parse(history).map((item: any) => ({
        ...item,
        date: new Date(item.date)
      }));
    } catch {
      return [];
    }
  }

  // Save backup to history
  saveBackupToHistory(result: BackupResult): void {
    const history = this.getBackupHistory();
    
    if (result.success) {
      history.unshift({
        date: new Date(),
        size: result.backupSize,
        fileCount: result.fileCount,
        location: result.backupUrl || 'local'
      });
      
      // Keep only last 10 backups in history
      history.splice(10);
      
      localStorage.setItem('backup-history', JSON.stringify(history));
    }
  }

  // Format file size for display
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const cloudBackupService = new CloudBackupService();
export type { BackupOptions, BackupResult };