import { InvoiceData, ValidationResult } from '../types';
import { GSTIN_REGEX, VEHICLE_REGEX } from '../constants';

export const validateInvoiceData = (data: InvoiceData): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  if (!data.invoiceNumber || data.invoiceNumber.trim() === '') {
    errors.invoiceNumber = 'Invoice Number is required';
    isValid = false;
  }

  if (!data.companyName || data.companyName.trim() === '') {
    errors.companyName = 'Company Name is required';
    isValid = false;
  }

  if (data.gstin && !GSTIN_REGEX.test(data.gstin.replace(/\s/g, ''))) {
    errors.gstin = 'Invalid Indian GSTIN format';
    isValid = false;
  } else if (!data.gstin) {
    errors.gstin = 'GSTIN is required';
    isValid = false;
  }

  if (data.vehicleNumber && !VEHICLE_REGEX.test(data.vehicleNumber.replace(/\s/g, ''))) {
    errors.vehicleNumber = 'Invalid Indian Vehicle Number format';
    isValid = false;
  }

  return { isValid, errors: errors as Record<keyof InvoiceData, string> };
};