import React, { useState, useEffect, useMemo } from 'react';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDF } from '../../components/pdf/InvoicePDF';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { PlusIcon, TrashIcon, DocumentArrowDownIcon, ArrowDownTrayIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument, removeDocument, query, orderBy } from '../../supabase/db';
import toast from 'react-hot-toast';

export default function InvoiceGenerator() {
  const { items: savedInvoices = [], loading } = useSupabaseCollection('invoices', useMemo(() => (base) => query(base, orderBy('created_at', 'desc')), []));
  const [activeTab, setActiveTab] = useState('create');
  
  const getNextInvoiceNo = (invoices) => {
    const currentYear = new Date().getFullYear();
    const prefix = `INV-${currentYear}-`;
    let maxSeq = 0;
    
    invoices.forEach(inv => {
      if (inv.invoiceNo && inv.invoiceNo.startsWith(prefix)) {
        const seqStr = inv.invoiceNo.replace(prefix, '');
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });
    
    return `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
  };

  const [invoiceData, setInvoiceData] = useState({
    invoiceNo: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    clientName: '',
    clientCompany: '',
    clientAddress: '',
    clientEmail: '',
    clientPhone: '',
    discount: 0,
    notes: 'Thank you for your business!',
    bankName: '',
    accountName: '',
    accountNo: '',
    ifsc: '',
    upiId: '',
  });

  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, rate: 0 }
  ]);

  const [deleteId, setDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setInvoiceData(prev => ({
        ...prev,
        invoiceNo: getNextInvoiceNo(savedInvoices)
      }));
    }
  }, [savedInvoices, loading]);

  const handleDataChange = (field, value) => {
    setInvoiceData({ ...invoiceData, [field]: value });
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate)), 0);
  const total = subtotal - Number(invoiceData.discount);

  const downloadPDF = async (dataToUse, itemsToUse) => {
    try {
      const blob = await pdf(<InvoicePDF data={dataToUse} items={itemsToUse} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${dataToUse.invoiceNo || 'Invoice'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      toast.error('Failed to download invoice PDF');
      throw error;
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setInvoiceData({
      invoiceNo: getNextInvoiceNo(savedInvoices),
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
      clientName: '',
      clientCompany: '',
      clientAddress: '',
      clientEmail: '',
      clientPhone: '',
      discount: 0,
      notes: 'Thank you for your business!',
      bankName: '',
      accountName: '',
      accountNo: '',
      ifsc: '',
      upiId: '',
    });
    setItems([{ id: Date.now(), description: '', quantity: 1, rate: 0 }]);
  };

  const handleEdit = (invoice) => {
    setEditingId(invoice.id);
    setInvoiceData({
      invoiceNo: invoice.invoiceNo || '',
      date: invoice.date || new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
      clientName: invoice.clientName || '',
      clientCompany: invoice.clientCompany || '',
      clientAddress: invoice.clientAddress || '',
      clientEmail: invoice.clientEmail || '',
      clientPhone: invoice.clientPhone || '',
      discount: invoice.discount || 0,
      notes: invoice.notes || 'Thank you for your business!',
      bankName: invoice.bankName || '',
      accountName: invoice.accountName || '',
      accountNo: invoice.accountNo || '',
      ifsc: invoice.ifsc || '',
      upiId: invoice.upiId || '',
    });
    setItems(invoice.items && invoice.items.length > 0 ? invoice.items : [{ id: Date.now(), description: '', quantity: 1, rate: 0 }]);
    setActiveTab('create');
  };

  const handleSaveAndDownload = async () => {
    if (!invoiceData.clientName && !invoiceData.clientCompany) {
      toast.error('Please enter a client name or company');
      return;
    }
    if (items.some(i => !i.description)) {
      toast.error('All line items must have a description');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save to database first
      const payload = {
        invoiceNo: invoiceData.invoiceNo,
        date: invoiceData.date,
        dueDate: invoiceData.dueDate,
        clientName: invoiceData.clientName,
        clientCompany: invoiceData.clientCompany,
        clientAddress: invoiceData.clientAddress,
        clientEmail: invoiceData.clientEmail,
        clientPhone: invoiceData.clientPhone,
        discount: Number(invoiceData.discount) || 0,
        notes: invoiceData.notes,
        bankName: invoiceData.bankName,
        accountName: invoiceData.accountName,
        accountNo: invoiceData.accountNo,
        ifsc: invoiceData.ifsc,
        upiId: invoiceData.upiId,
        items: items,
        subtotal,
        total
      };

      if (editingId) {
        await updateDocument('invoices', editingId, payload);
      } else {
        await createDocument('invoices', payload);
      }
      
      // 2. Download the PDF
      await downloadPDF(invoiceData, items);

      toast.success(editingId ? 'Invoice updated successfully' : 'Invoice saved successfully');
      
      // Reset form
      resetForm();
      setActiveTab('saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDownloadSaved = async (invoice) => {
    await downloadPDF(invoice, invoice.items || []);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeDocument('invoices', deleteId);
      toast.success('Invoice deleted successfully');
      setDeleteId(null);
    } catch (err) {
      toast.error('Failed to delete invoice');
    }
  };

  const columns = [
    { key: 'invoiceNo', label: 'Invoice No' },
    { key: 'date', label: 'Date' },
    { key: 'client', label: 'Client / Company' },
    { key: 'total', label: 'Total Amount' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end">
        <PageHeader eyebrow="Company" title="Invoice Generator" description="Create, save and download dynamic invoices." />
        
        <div className="inline-flex bg-slate-100 p-1 rounded-xl mb-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'create'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            {editingId ? 'Edit Invoice' : 'Create Invoice'}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === 'saved'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Saved Invoices
          </button>
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Client Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Client Name" value={invoiceData.clientName} onChange={(e) => handleDataChange('clientName', e.target.value)} placeholder="e.g. John Doe" />
                <Input label="Company Name" value={invoiceData.clientCompany} onChange={(e) => handleDataChange('clientCompany', e.target.value)} placeholder="e.g. Acme Corp" />
                <Input label="Email" type="email" value={invoiceData.clientEmail} onChange={(e) => handleDataChange('clientEmail', e.target.value)} placeholder="john@example.com" />
                <Input label="Phone" value={invoiceData.clientPhone} onChange={(e) => handleDataChange('clientPhone', e.target.value)} placeholder="+91 9876543210" />
                <div className="md:col-span-2">
                  <Input label="Address" value={invoiceData.clientAddress} onChange={(e) => handleDataChange('clientAddress', e.target.value)} placeholder="123 Business Rd, City, State, Zip" />
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <div className="flex justify-between items-center border-b pb-2 mb-4">
                <h3 className="font-semibold text-lg">Line Items</h3>
              </div>
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="flex gap-4 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex-1">
                      <Input label="Service Description" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} placeholder="Service description..." />
                    </div>
                    <div className="w-24">
                      <Input type="number" label="Qty" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} />
                    </div>
                    <div className="w-32">
                      <Input type="number" label="Unit Price" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)} />
                    </div>
                    <div className="w-32">
                      <Input label="Amount" value={(Number(item.quantity) * Number(item.rate)).toFixed(2)} disabled />
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-0.5" disabled={items.length === 1}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <Button variant="secondary" onClick={addItem} className="gap-2 mt-4 text-sm w-full">
                <PlusIcon className="w-4 h-4" /> Add Item
              </Button>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Invoice Info</h3>
              <Input label="Invoice Number" value={invoiceData.invoiceNo} onChange={(e) => handleDataChange('invoiceNo', e.target.value)} />
              <Input type="date" label="Invoice Date" value={invoiceData.date} onChange={(e) => handleDataChange('date', e.target.value)} />
              <Input type="date" label="Due Date" value={invoiceData.dueDate} onChange={(e) => handleDataChange('dueDate', e.target.value)} />
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2 mb-4">Totals</h3>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input type="number" label="Discount" value={invoiceData.discount} onChange={(e) => handleDataChange('discount', e.target.value)} />
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span>- ₹{Number(invoiceData.discount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-primary-700 pt-2 border-t">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-4 border-t mt-4">
                <h3 className="font-semibold text-lg pb-2 mb-2">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Bank Name" value={invoiceData.bankName} onChange={(e) => handleDataChange('bankName', e.target.value)} />
                  <Input label="Account Name" value={invoiceData.accountName} onChange={(e) => handleDataChange('accountName', e.target.value)} />
                  <Input label="Account No" value={invoiceData.accountNo} onChange={(e) => handleDataChange('accountNo', e.target.value)} />
                  <Input label="IFSC Code" value={invoiceData.ifsc} onChange={(e) => handleDataChange('ifsc', e.target.value)} />
                  <div className="col-span-2">
                    <Input label="UPI ID" value={invoiceData.upiId} onChange={(e) => handleDataChange('upiId', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t mt-4">
                <label className="block text-sm font-semibold text-neutral-900 mb-1.5">Payment Terms / Notes</label>
                <textarea
                  className="w-full text-sm text-slate-900 bg-white p-3 rounded-xl border border-slate-200 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none resize-y min-h-[80px]"
                  value={invoiceData.notes}
                  onChange={(e) => handleDataChange('notes', e.target.value)}
                />
              </div>

              <div className="flex gap-4 mt-4">
                {editingId && (
                  <Button variant="secondary" onClick={resetForm} className="w-1/3">
                    Cancel
                  </Button>
                )}
                <Button onClick={handleSaveAndDownload} disabled={isSaving} className={`gap-2 ${editingId ? 'w-2/3' : 'w-full'}`}>
                  <DocumentArrowDownIcon className="w-5 h-5" /> {isSaving ? 'Saving...' : (editingId ? 'Update & Download PDF' : 'Save & Download PDF')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <Card>
          <Table
            columns={columns}
            data={savedInvoices}
            loading={loading}
            renderRow={(invoice) => (
              <tr key={invoice.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{invoice.invoiceNo}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{new Date(invoice.date).toLocaleDateString('en-GB')}</td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  {invoice.clientCompany || invoice.clientName}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  ₹{Number(invoice.total || 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Invoice"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDownloadSaved(invoice)}
                      className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteId(invoice.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            emptyMessage="No saved invoices found."
          />
        </Card>
      )}

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
