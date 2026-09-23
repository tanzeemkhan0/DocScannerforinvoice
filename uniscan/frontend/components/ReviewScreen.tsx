import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, AlertTriangle, CheckCircle, Plus, Trash2, Download, FileText } from 'lucide-react';
import { useAppStore } from '../store';
import { InvoiceData, LineItem } from '../types';
import { validateInvoiceData } from '../services/validationService';

const ReviewScreen: React.FC = () => {
  const { invoices, editingInvoiceId, setDashboardMode, updateInvoice } = useAppStore();
  const invoice = invoices.find(inv => inv.id === editingInvoiceId);
  
  const [formData, setFormData] = useState<InvoiceData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (invoice) {
      setFormData(JSON.parse(JSON.stringify(invoice.data))); // Deep copy
      const validation = validateInvoiceData(invoice.data);
      setErrors(validation.errors);
    }
  }, [invoice]);

  if (!invoice || !formData) return null;

  const handleInputChange = (field: keyof InvoiceData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    const validation = validateInvoiceData(newData);
    setErrors(validation.errors);
  };

  const handleLineItemChange = (id: string, field: keyof LineItem, value: string) => {
    const newLineItems = formData.lineItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, lineItems: newLineItems });
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Math.random().toString(36).substring(2, 9),
      description: '', qty: '', rate: '', amount: '', tax: '', total: ''
    };
    setFormData({ ...formData, lineItems: [...formData.lineItems, newItem] });
  };

  const removeLineItem = (id: string) => {
    setFormData({ ...formData, lineItems: formData.lineItems.filter(item => item.id !== id) });
  };

  const handleSave = () => {
    const validation = validateInvoiceData(formData);
    if (validation.isValid) {
      updateInvoice(invoice.id, { data: formData, status: 'verified' });
      setDashboardMode();
    } else {
      setErrors(validation.errors);
      alert('Please fix the highlighted errors before saving.');
    }
  };

  const handleDownloadImage = () => {
    const a = document.createElement('a');
    a.href = invoice.imageUrl;
    a.download = `Document_${formData.invoiceNumber || invoice.id}.jpg`;
    a.click();
  };

  const handleDownloadPDF = () => {
    // Create a hidden iframe to trigger the browser's native print-to-PDF functionality
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '-9999px';
    iframe.style.bottom = '-9999px';
    document.body.appendChild(iframe);

    const img = new Image();
    img.onload = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      
      // Set page orientation based on image dimensions
      const isLandscape = img.width > img.height;
      const pageCss = isLandscape ? '@page { size: landscape; margin: 0; }' : '@page { size: portrait; margin: 0; }';

      doc.write(`
        <html>
          <head>
            <title>Doc_${formData.invoiceNumber || invoice.id}</title>
            <style>
              ${pageCss}
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: white; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${invoice.imageUrl}" />
          </body>
        </html>
      `);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    };
    img.src = invoice.imageUrl;
  };

  const renderInput = (label: string, field: keyof InvoiceData, placeholder: string = '') => {
    const hasError = !!errors[field];
    return (
      <div className="mb-4">
        <label className="block text-xs font-medium text-industrial-400 mb-1 uppercase tracking-wider">
          {label}
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData[field] as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            className={`block w-full px-3 py-2 bg-industrial-900 border rounded-md text-sm text-white focus:outline-none focus:ring-1 
              ${hasError 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-industrial-600 focus:ring-industrial-blue focus:border-industrial-blue'}`}
          />
          {hasError && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
          )}
        </div>
        {hasError && <p className="mt-1 text-xs text-red-400">{errors[field]}</p>}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-industrial-900 flex flex-col">
      {/* Header */}
      <header className="bg-industrial-800 border-b border-industrial-700 px-4 py-3 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <button 
            onClick={setDashboardMode}
            className="p-2 hover:bg-industrial-700 rounded-full text-industrial-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Fast-Verify Review</h1>
            <p className="text-xs text-industrial-400">ID: {invoice.id}</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center space-x-2 px-4 py-2 bg-industrial-blue hover:bg-industrial-blueHover text-white text-sm font-medium rounded-md transition-colors shadow-sm"
        >
          <Save size={16} />
          <span>Verify & Save</span>
        </button>
      </header>

      {/* Split Screen Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Pane: Image Viewer */}
        <div className="w-full lg:w-1/2 bg-black border-b lg:border-b-0 lg:border-r border-industrial-700 flex items-center justify-center overflow-hidden relative min-h-[40vh] lg:min-h-0 group">
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded text-xs text-white z-10">
            Scanned Document
          </div>
          
          {/* Download Actions */}
          <div className="absolute top-4 right-4 flex space-x-2 z-10 opacity-80 hover:opacity-100 transition-opacity">
            <button 
              onClick={handleDownloadImage}
              className="bg-black/60 hover:bg-black/80 backdrop-blur-sm p-2 rounded text-white transition-colors"
              title="Download Image"
            >
              <Download size={16} />
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="bg-industrial-blue/80 hover:bg-industrial-blue backdrop-blur-sm p-2 rounded text-white transition-colors flex items-center space-x-1"
              title="Save as PDF"
            >
              <FileText size={16} />
              <span className="text-xs font-medium pr-1">PDF</span>
            </button>
          </div>

          <img 
            src={invoice.imageUrl} 
            alt="Document" 
            className="max-w-full max-h-full object-contain p-4"
          />
        </div>

        {/* Right Pane: Editable Form */}
        <div className="w-full lg:w-1/2 bg-industrial-800 overflow-y-auto p-6">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-industrial-700">
            <h2 className="text-lg font-semibold text-white flex items-center">
              Extracted Data
              {Object.keys(errors).length === 0 ? (
                <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  <CheckCircle size={12} className="mr-1" /> Looks Good
                </span>
              ) : (
                <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle size={12} className="mr-1" /> Needs Review
                </span>
              )}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {renderInput('Invoice Number', 'invoiceNumber')}
            {renderInput('Date', 'date', 'DD/MM/YYYY')}
            <div className="md:col-span-2">
              {renderInput('Company Name', 'companyName')}
            </div>
            <div className="md:col-span-2">
              {renderInput('Address', 'address')}
            </div>
            {renderInput('GSTIN', 'gstin', 'e.g. 27AAPFU0939F1ZV')}
            {renderInput('Vehicle Number', 'vehicleNumber', 'e.g. MH 12 AB 1234')}
            {renderInput('Total Weight', 'totalWeight')}
            {renderInput('Total Tax', 'totalTax')}
            <div className="md:col-span-2">
              {renderInput('Total Value (RS)', 'totalValueRs')}
            </div>
          </div>

          {/* Line Items Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-industrial-300 uppercase tracking-wider">Line Items</h3>
              <button 
                onClick={addLineItem}
                className="flex items-center space-x-1 text-xs text-industrial-blue hover:text-industrial-blueHover"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {formData.lineItems.map((item, index) => (
                <div key={item.id} className="bg-industrial-900/50 p-4 rounded-lg border border-industrial-700 relative group">
                  <button 
                    onClick={() => removeLineItem(item.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 sm:col-span-4">
                      <label className="block text-[10px] text-industrial-500 mb-1">Description of goods</label>
                      <input type="text" value={item.description} onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)} className="w-full bg-industrial-800 border border-industrial-700 rounded px-2 py-1 text-sm text-white focus:border-industrial-blue focus:outline-none" />
                    </div>
                    <div className="col-span-4 sm:col-span-1">
                      <label className="block text-[10px] text-industrial-500 mb-1">Qty</label>
                      <input type="text" value={item.qty} onChange={(e) => handleLineItemChange(item.id, 'qty', e.target.value)} className="w-full bg-industrial-800 border border-industrial-700 rounded px-2 py-1 text-sm text-white focus:border-industrial-blue focus:outline-none" />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-industrial-500 mb-1">Rate</label>
                      <input type="text" value={item.rate} onChange={(e) => handleLineItemChange(item.id, 'rate', e.target.value)} className="w-full bg-industrial-800 border border-industrial-700 rounded px-2 py-1 text-sm text-white focus:border-industrial-blue focus:outline-none" />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-industrial-500 mb-1">Amount</label>
                      <input type="text" value={item.amount} onChange={(e) => handleLineItemChange(item.id, 'amount', e.target.value)} className="w-full bg-industrial-800 border border-industrial-700 rounded px-2 py-1 text-sm text-white focus:border-industrial-blue focus:outline-none" />
                    </div>
                    <div className="col-span-6 sm:col-span-1">
                      <label className="block text-[10px] text-industrial-500 mb-1">Tax</label>
                      <input type="text" value={item.tax} onChange={(e) => handleLineItemChange(item.id, 'tax', e.target.value)} className="w-full bg-industrial-800 border border-industrial-700 rounded px-2 py-1 text-sm text-white focus:border-industrial-blue focus:outline-none" />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                      <label className="block text-[10px] text-industrial-500 mb-1">Total</label>
                      <input type="text" value={item.total} onChange={(e) => handleLineItemChange(item.id, 'total', e.target.value)} className="w-full bg-industrial-800 border border-industrial-700 rounded px-2 py-1 text-sm text-white focus:border-industrial-blue focus:outline-none" />
                    </div>
                  </div>
                </div>
              ))}
              {formData.lineItems.length === 0 && (
                <div className="text-center py-6 text-industrial-500 text-sm border border-dashed border-industrial-700 rounded-lg">
                  No line items extracted.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReviewScreen;