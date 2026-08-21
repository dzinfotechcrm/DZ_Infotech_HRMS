import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { QuotationPDF } from '../../../components/pdf/QuotationPDF';
import toast from 'react-hot-toast';

const getSavedQuotations = () => {
  const saved = localStorage.getItem('savedQuotations');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved quotations', e);
    }
  }
  return [];
};

const getInitialState = (savedQuotations = []) => {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `QT-${today}-`;
  
  let maxSeq = 0;
  savedQuotations.forEach(q => {
    if (q.quotationNumber && q.quotationNumber.startsWith(prefix)) {
      const seqStr = q.quotationNumber.replace(prefix, '');
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  const nextSeq = (maxSeq + 1).toString().padStart(2, '0');

  return {
    clientName: '',
    contactPerson: '',
    quotationNumber: `${prefix}${nextSeq}`,
    quotationDate: new Date().toISOString().slice(0, 10),
    validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    businessObjective: '',
    proposedSolution: '',
    manufacturingCost: 40000,
    inventoryCost: 30000,
    salesCost: 20000,
    hrCost: 20000,
    reportsCost: 15000,
    deploymentCost: 15000,
    specialProjectPrice: 150000,
    amcCost: 30000,
    gstin: '',
    registeredAddress: ''
  };
};

export default function CompanyQuotations() {
  const [savedQuotations, setSavedQuotations] = useState(getSavedQuotations);
  const [formData, setFormData] = useState(() => getInitialState(getSavedQuotations()));
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'saved'
  const [deleteItem, setDeleteItem] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'gstin' ? value.toUpperCase() : value
    }));
  };

  const handleGenerateAndSave = async () => {
    setIsGenerating(true);
    try {
      // 1. Generate PDF
      const blob = await pdf(<QuotationPDF data={formData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.quotationNumber}_${formData.clientName.replace(/\s+/g, '_') || 'Draft'}_Quotation.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 2. Save to localStorage
      const newSaved = [...savedQuotations, { ...formData, id: Date.now().toString(), createdAt: new Date().toISOString() }];
      setSavedQuotations(newSaved);
      localStorage.setItem('savedQuotations', JSON.stringify(newSaved));

      // 3. Reset form
      setFormData(getInitialState(newSaved));
      toast.success('Quotation generated and saved successfully!');
    } catch (error) {
      console.error('Failed to generate PDF', error);
      toast.error('Failed to generate quotation');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = () => {
    if (deleteItem) {
      const newSaved = savedQuotations.filter(q => q.id !== deleteItem.id);
      setSavedQuotations(newSaved);
      localStorage.setItem('savedQuotations', JSON.stringify(newSaved));
      setDeleteItem(null);
      toast.success('Quotation deleted successfully!');
    }
  };

  const handleDownload = async (quotation) => {
    setDownloadingId(quotation.id);
    try {
      const blob = await pdf(<QuotationPDF data={quotation} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quotation.quotationNumber}_${quotation.clientName.replace(/\s+/g, '_')}_Quotation.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Quotation downloaded successfully!');
    } catch (error) {
      console.error('Failed to generate PDF', error);
      toast.error('Failed to download quotation');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Quotations" description="Generate and manage company quotations" />

      <div className="inline-flex bg-slate-100 p-1 rounded-xl mb-2">
        <button
          className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'create'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('create')}
        >
          Create Quotation
        </button>
        <button
          className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            activeTab === 'saved'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
          }`}
          onClick={() => setActiveTab('saved')}
        >
          Saved Quotation
        </button>
      </div>

      {activeTab === 'create' ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Generate ERP Quotation</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-neutral-700 border-b pb-2">Client Details</h3>
              <Input label="Client Company Name" name="clientName" value={formData.clientName} onChange={handleChange} required />
              <Input label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleChange} required />
              <Input label="Client GSTIN" name="gstin" value={formData.gstin} onChange={handleChange} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">Registered Address</label>
                <textarea
                  className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                  rows={3}
                  name="registeredAddress"
                  value={formData.registeredAddress}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-neutral-700 border-b pb-2">Quotation Details</h3>
              <Input label="Quotation Number" name="quotationNumber" value={formData.quotationNumber} onChange={handleChange} required />
              <Input label="Quotation Date" type="date" name="quotationDate" value={formData.quotationDate} onChange={handleChange} required />
              <Input label="Validity Date" type="date" name="validityDate" value={formData.validityDate} onChange={handleChange} required />
            </div>

            <div className="md:col-span-2 space-y-4 mt-4">
              <h3 className="font-medium text-neutral-700 border-b pb-2">Project Overview</h3>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">Business Objective</label>
                <textarea
                  className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                  rows={3}
                  name="businessObjective"
                  placeholder="One to two sentences on the client's business, plant/operations, and the core problem this ERP solves for them."
                  value={formData.businessObjective}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-neutral-700">Proposed Solution</label>
                <textarea
                  className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                  rows={3}
                  name="proposedSolution"
                  placeholder="One to two sentences on the proposed system — a fully customized ERP built around the client's actual workflow."
                  value={formData.proposedSolution}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-4 mt-4">
              <h3 className="font-medium text-neutral-700 border-b pb-2">Commercials (₹)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Input label="Manufacturing & Prod." type="number" name="manufacturingCost" value={formData.manufacturingCost} onChange={handleChange} />
                <Input label="Inventory & Purchase" type="number" name="inventoryCost" value={formData.inventoryCost} onChange={handleChange} />
                <Input label="Sales & Dispatch" type="number" name="salesCost" value={formData.salesCost} onChange={handleChange} />
                <Input label="HR & Payroll" type="number" name="hrCost" value={formData.hrCost} onChange={handleChange} />
                <Input label="Reports & Access" type="number" name="reportsCost" value={formData.reportsCost} onChange={handleChange} />
                <Input label="Deployment & Training" type="number" name="deploymentCost" value={formData.deploymentCost} onChange={handleChange} />
                <Input label="Special Project Price" type="number" name="specialProjectPrice" value={formData.specialProjectPrice} onChange={handleChange} />
                <Input label="Annual Maintenance (AMC)" type="number" name="amcCost" value={formData.amcCost} onChange={handleChange} />
              </div>
              <p className="text-xs text-neutral-500 mt-2">Note: Core ERP Application Development is fixed at ₹1,20,000 in the template.</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button 
              type="button" 
              variant="primary" 
              disabled={isGenerating || !formData.clientName} 
              onClick={handleGenerateAndSave}
            >
              {isGenerating ? 'Generating PDF...' : 'Download Quotation PDF'}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">Saved Quotations</h2>
          </div>

          {savedQuotations.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              No saved quotations found. Create a new quotation to see it here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Quotation No.</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedQuotations.slice().reverse().map((quotation) => (
                    <tr key={quotation.id} className="border-b hover:bg-neutral-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(quotation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {quotation.quotationNumber}
                      </td>
                      <td className="px-4 py-3">
                        {quotation.clientName}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={downloadingId === quotation.id}
                          onClick={() => handleDownload(quotation)}
                        >
                          {downloadingId === quotation.id ? 'Generating...' : 'Download PDF'}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteItem(quotation)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <ConfirmModal
        open={!!deleteItem}
        title="Delete Quotation"
        message="Are you sure you want to delete this quotation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}
