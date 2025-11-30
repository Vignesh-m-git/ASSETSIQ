export interface AssetData {
  "Asset Tag": string;
  "Block": string;
  "Floor": string;
  "Dept": string;
  "Brand": string;
  "Service Tag": string;
  "Computer Name": string;
  "Processor Type": string;
  "Processor Generation": string;
  "Processor Speed (GHz)": string;
  "RAM (GB)": string;
  "Hard Drive Type": string;
  "Hard Drive Size": string;
  "Graphics Card": string;
  "Operating System OS": string;
  "Operating System Architecture": string;
  "Operating System Version": string;
  "Windows License Key": string;
  "MS Office Version": string;
  "MS Office License Key": string;
  "Installed Applications": string;
  "Antivirus": string;
  "IP Address": string;
  "Remarks": string;
}

export interface ExtractionHistoryItem {
  id: string;
  user_id: string;
  created_at: string;
  filename: string;
  extracted_json: AssetData[];
}

export interface UserSession {
  id: string;
  email: string;
}

export type FilterOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'isEmpty' | 'isNotEmpty';

export interface FilterRule {
  id: string;
  column: keyof AssetData;
  operator: FilterOperator;
  value: string;
}