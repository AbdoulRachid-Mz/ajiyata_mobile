import { Attachment } from '@/types';

export type AttachmentType = 'image' | 'receipt' | 'document';

export interface AttachmentWithUri extends Attachment {
  localUri: string;
  uploadProgress?: number;
  isUploading?: boolean;
}

export interface AttachmentUploadState {
  id: string;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface AttachmentPickerResult {
  uri: string;
  fileName?: string;
  fileSize?: number;
  type?: AttachmentType;
}