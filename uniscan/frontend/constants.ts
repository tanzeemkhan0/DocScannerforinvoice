export const CREDENTIALS = {
  userId: 'UNIVERSAL',
  password: 'UNI@3545'
};

// Relaxed Indian GSTIN Regex to account for slight OCR variations (15 chars: 2 digits, 5 letters, 4 digits, 1 letter, 3 alphanumeric)
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$/i;

// Simplified Indian Vehicle Number Regex (e.g., MH 12 AB 1234 or MH12AB1234)
export const VEHICLE_REGEX = /^[A-Z]{2}[ -]?[0-9]{1,2}(?:[ -]?[A-Z])?(?:[ -]?[A-Z]*)?[ -]?[0-9]{4}$/i;

export const EMPTY_INVOICE_DATA = {
  invoiceNumber: '',
  date: '',
  companyName: '',
  address: '',
  gstin: '',
  vehicleNumber: '',
  totalWeight: '',
  totalTax: '',
  totalValueRs: '',
  lineItems: []
};
