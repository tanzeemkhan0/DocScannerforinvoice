import React, { useRef, useState } from 'react';
import { UploadCloud, Camera, FileSpreadsheet, LogOut, AlertCircle, CheckCircle2, Clock, Eye, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';
import { extractInvoiceData } from '../services/geminiService';
import { validateInvoiceData } from '../services/validationService';
import { EMPTY_INVOICE_DATA } from '../constants';
import DocumentScanner from './DocumentScanner';
import { Logo } from './Logo';

const Dashboard: React.FC = () => {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, setReviewMode, logout } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG/PNG).');
      return;
    }

    setIsProcessing(true);
    const newId = Math.random().toString(36).substring(2, 9);
    const imageUrl = URL.createObjectURL(file);
    
    // Add initial processing record
    addInvoice({
      id: newId,
      imageUrl,
      uploadDate: new Date().toISOString(),
      status: 'processing',
      data: { ...EMPTY_INVOICE_DATA }
    });

    try {
      const extractedData = await extractInvoiceData(file);
      const validation = validateInvoiceData(extractedData);
      
      updateInvoice(newId, {
        status: validation.isValid ? 'verified' : 'review',
        data: extractedData
      });
    } catch (error) {
      console.error("Extraction failed", error);
      updateInvoice(newId, {
        status: 'review',
        data: { ...EMPTY_INVOICE_DATA, companyName: 'Extraction Failed - Manual Entry Required' }
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
    // Reset input so same file can be selected again if needed
    if (e.target) e.target.value = '';
  };

  const exportToCSV = () => {
    if (invoices.length === 0) return;

    const headers = [
      'ID', 'Upload Date', 'Invoice Date', 'Invoice No', 'Company', 
      'Address', 'GSTIN', 'Vehicle No', 'Total Weight', 'Total Tax', 
      'Total Value (RS)', 'Status', 
      'Item Description', 'Item Qty', 'Item Rate', 'Item Amount', 'Item Tax', 'Item Total'
    ];
    
    const rows: string[][] = [];

    invoices.forEach(inv => {
      const baseData = [
        inv.id,
        new Date(inv.uploadDate).toLocaleDateString(),
        inv.data.date || 'N/A',
        inv.data.invoiceNumber || 'N/A',
        inv.data.companyName || 'N/A',
        inv.data.address || 'N/A',
        inv.data.gstin || 'N/A',
        inv.data.vehicleNumber || 'N/A',
        inv.data.totalWeight || 'N/A',
        inv.data.totalTax || 'N/A',
        inv.data.totalValueRs || 'N/A',
        inv.status
      ];

      if (inv.data.lineItems && inv.data.lineItems.length > 0) {
        // Create a row for each line item
        inv.data.lineItems.forEach(item => {
          rows.push([
            ...baseData,
            item.description || '',
            item.qty || '',
            item.rate || '',
            item.amount || '',
            item.tax || '',
            item.total || ''
          ]);
        });
      } else {
        // If no line items, just output the invoice data with empty item columns
        rows.push([...baseData, '', '', '', '', '', '']);
      }
    });

    const csvContent = [
      headers.join(','),
      // Properly escape quotes in CSV values
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 size={12} className="mr-1"/> Verified</span>;
      case 'review':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle size={12} className="mr-1"/> Review</span>;
      case 'processing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock size={12} className="mr-1 animate-spin"/> Processing</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-industrial-900 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-industrial-800 border-b border-industrial-700 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <Logo className="h-10 w-auto" />
          <div className="h-8 w-px bg-industrial-600 hidden sm:block"></div>
          <h1 className="text-xl font-bold text-white tracking-wide hidden sm:block">UNISCAN</h1>
        </div>
        <button 
          onClick={logout}
          className="flex items-center space-x-2 text-industrial-400 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
        
        {/* Action Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Drag & Drop Zone */}
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
              ${isDragging ? 'border-industrial-blue bg-industrial-800/50' : 'border-industrial-600 hover:border-industrial-500 bg-industrial-800'}
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg, image/png" 
              onChange={onFileInputChange}
            />
            <UploadCloud size={48} className="text-industrial-400 mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">Upload Document</h3>
            <p className="text-sm text-industrial-400">Drag & drop an image, or click to browse</p>
            <p className="text-xs text-industrial-500 mt-2">Supports JPEG, PNG</p>
          </div>

          {/* Mobile Camera Scan */}
          <div 
            className={`border border-industrial-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-industrial-800 hover:bg-industrial-700/50 transition-colors cursor-pointer
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
            onClick={() => setIsScannerOpen(true)}
          >
            <div className="bg-industrial-900 p-4 rounded-full mb-4 border border-industrial-600">
              <Camera size={32} className="text-industrial-blue" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Scan with Camera</h3>
            <p className="text-sm text-industrial-400">Auto-crop and remove background</p>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-industrial-800 rounded-xl border border-industrial-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-industrial-700 flex justify-between items-center bg-industrial-800/80">
            <h2 className="text-lg font-semibold text-white">Processed Documents</h2>
            <button 
              onClick={exportToCSV}
              disabled={invoices.length === 0}
              className="flex items-center space-x-2 px-3 py-1.5 bg-industrial-700 hover:bg-industrial-600 text-white text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet size={16} />
              <span>Export CSV</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-industrial-300">
              <thead className="text-xs text-industrial-400 uppercase bg-industrial-900/50 border-b border-industrial-700">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-industrial-500">
                      No documents processed yet. Upload or scan to begin.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-industrial-700/50 hover:bg-industrial-700/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(invoice.uploadDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-industrial-100">{invoice.data.invoiceNumber || '-'}</td>
                      <td className="px-4 py-3 truncate max-w-[200px]">{invoice.data.companyName || '-'}</td>
                      <td className="px-4 py-3">{invoice.data.vehicleNumber || '-'}</td>
                      <td className="px-4 py-3">{getStatusBadge(invoice.status)}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button 
                          onClick={() => setReviewMode(invoice.id)}
                          disabled={invoice.status === 'processing'}
                          className="inline-flex items-center p-1.5 bg-industrial-blue/10 text-industrial-blue hover:bg-industrial-blue hover:text-white rounded transition-colors disabled:opacity-50"
                          title="Review / Edit"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => deleteInvoice(invoice.id)}
                          className="inline-flex items-center p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Full Screen Scanner Modal */}
      {isScannerOpen && (
        <DocumentScanner 
          onClose={() => setIsScannerOpen(false)} 
          onCapture={(file) => {
            setIsScannerOpen(false);
            handleFileProcess(file);
          }} 
        />
      )}
    </div>
  );
};

export default Dashboard;
