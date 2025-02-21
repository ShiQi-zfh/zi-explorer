export interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedTime: string | Date | number;
}

export interface FolderInfo {
  name: string;
  path: string;
  children?: FolderInfo[];
}
