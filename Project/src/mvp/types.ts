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

export const EMPTY_FIELDS: Fields = { docType: '', date: '', diag: '', cost: '' };
