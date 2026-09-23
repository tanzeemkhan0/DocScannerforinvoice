import { GoogleGenAI, Type } from '@google/genai';
import { InvoiceData } from '../types';

// Initialize the SDK. It automatically picks up process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY, vertexai: true });

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Extract just the base64 data part
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const extractInvoiceData = async (file: File): Promise<InvoiceData> => {
  try {
    const base64Data = await fileToBase64(file);
    const mimeType = file.type || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: 'Extract the invoice details from the image.\n\nCRITICAL INSTRUCTIONS FOR GSTIN:\n- You MUST extract the Seller/Vendor GSTIN.\n- It is a 15-character alphanumeric code (e.g., 27AAPFU0939F1ZV).\n- Look near the top of the document, next to the seller\'s company name or address.\n- Do NOT extract the Buyer/Recipient GSTIN.\n\nExtract all line items accurately including Description, Qty, Rate, Amount, Tax, and Total. If a field is not found, leave it as an empty string.',
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING, description: 'The invoice or challan number' },
            date: { type: Type.STRING, description: 'The date of the invoice' },
            companyName: { type: Type.STRING, description: 'The name of the billing company or vendor' },
            address: { type: Type.STRING, description: 'The address of the company' },
            gstin: { type: Type.STRING, description: 'The 15-digit GSTIN of the SELLER/VENDOR (e.g., 27AAPFU0939F1ZV). Do not extract the buyer GSTIN.' },
            vehicleNumber: { type: Type.STRING, description: 'The vehicle registration number if present' },
            totalWeight: { type: Type.STRING, description: 'Total weight if mentioned' },
            totalTax: { type: Type.STRING, description: 'Total tax amount for the entire invoice' },
            totalValueRs: { type: Type.STRING, description: 'Total value or grand total in RS' },
            lineItems: {
              type: Type.ARRAY,
              description: 'List of items in the invoice',
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: 'Description of goods' },
                  qty: { type: Type.STRING, description: 'Quantity' },
                  rate: { type: Type.STRING, description: 'Rate or price per unit' },
                  amount: { type: Type.STRING, description: 'Amount before tax' },
                  tax: { type: Type.STRING, description: 'Tax amount or percentage' },
                  total: { type: Type.STRING, description: 'Total value for the line item' },
                },
              },
            },
          },
        },
      },
    });

    const jsonStr = response.text.trim();
    const parsedData = JSON.parse(jsonStr);
    
    // Post-processing: Clean up GSTIN in case the model included extra text like "GSTIN: "
    if (parsedData.gstin) {
      // Look for a 15-character string matching the general GSTIN pattern anywhere in the extracted text
      const gstinMatch = parsedData.gstin.match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}/i);
      if (gstinMatch) {
        parsedData.gstin = gstinMatch[0].toUpperCase();
      } else {
        // Fallback: just remove spaces and uppercase
        parsedData.gstin = parsedData.gstin.replace(/\s/g, '').toUpperCase();
      }
    }

    // Ensure line items have unique IDs for React rendering
    if (parsedData.lineItems && Array.isArray(parsedData.lineItems)) {
        parsedData.lineItems = parsedData.lineItems.map((item: any) => ({
            ...item,
            id: Math.random().toString(36).substring(2, 9)
        }));
    } else {
        parsedData.lineItems = [];
    }

    return parsedData as InvoiceData;
  } catch (error) {
    console.error('Error extracting data with Gemini:', error);
    throw new Error('Failed to extract data from image.');
  }
};
