export interface LineItem {
  id: string;
  description: string;
  qty: string;
  rate: string;
  amount: string;
  tax: string;
  total: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  companyName: string;
  address: string;
  gstin: string;
  vehicleNumber: string;
  totalWeight: string;
  totalTax: string;
  totalValueRs: string;
  lineItems: LineItem[];
}

export type InvoiceStatus = 'processing' | 'review' | 'verified';

export interface InvoiceRecord {
  id: string;
  imageUrl: string;
  uploadDate: string;
  status: InvoiceStatus;
  data: InvoiceData;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<keyof InvoiceData, string>;
}