export interface UploadInfo {
  name: string;
  url: string;
  downloadName: string;
  status: string;
}

export interface Fields {
  docType: string;
  date: string;
  diag: string;
  cost: string;
}

export interface AiAnalysis {
  summary: string;
  evidence: string[];
  warnings: string[];
  source: 'gemini' | 'tesseract' | 'example';
}

export const EMPTY_FIELDS: Fields = { docType: '', date: '', diag: '', cost: '' };
