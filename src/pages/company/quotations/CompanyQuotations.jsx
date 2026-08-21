import React, { useState, useEffect } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import Select from '../../../components/ui/Select';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { QuotationPDF } from '../../../components/pdf/QuotationPDF';
import toast from 'react-hot-toast';
import { useSupabaseCollection } from '../../../hooks/useSupabase';

const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

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
    registeredAddress: '',
    clientPhone: ''
  };
};

export default function CompanyQuotations() {
  const { items: clients } = useSupabaseCollection('clients');
  const [savedQuotations, setSavedQuotations] = useState(getSavedQuotations);
  const [formData, setFormData] = useState(() => getInitialState(getSavedQuotations()));
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'saved'
  const [deleteItem, setDeleteItem] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [showWhatsAppConfirm, setShowWhatsAppConfirm] = useState(false);
  const [generatedQuotation, setGeneratedQuotation] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'clientName') {
      const selectedClient = clients.find(c => c.companyName === value);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          clientName: value,
          contactPerson: selectedClient.contactPerson || '',
          gstin: selectedClient.gstin || '',
          registeredAddress: selectedClient.address || '',
          clientPhone: selectedClient.phone || ''
        }));
        return;
      }
    }

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

      // 3. Prompt for WhatsApp (delaying form reset until modal is closed)
      setGeneratedQuotation({ ...formData });
      setShowWhatsAppConfirm(true);
      toast.success('Quotation generated and saved successfully!');
    } catch (error) {
      console.error('Failed to generate PDF', error);
      toast.error('Failed to generate quotation');
    } finally {
      setIsGenerating(false);
    }
  };

  const closeWhatsAppPrompt = () => {
    setShowWhatsAppConfirm(false);
    setGeneratedQuotation(null);
    setFormData(getInitialState(savedQuotations));
  };

  const handleSendWhatsApp = () => {
    if (!generatedQuotation) return;

    const q = generatedQuotation;
    const totalCost = (Number(q.manufacturingCost) || 0) +
      (Number(q.inventoryCost) || 0) +
      (Number(q.salesCost) || 0) +
      (Number(q.hrCost) || 0) +
      (Number(q.reportsCost) || 0) +
      (Number(q.deploymentCost) || 0) +
      (Number(q.specialProjectPrice) || 0) +
      (Number(q.amcCost) || 0) +
      120000; // Base ERP

    let breakdown = `- Core Application: ₹1,20,000\n`;
    if (Number(q.manufacturingCost) > 0) breakdown += `- Manufacturing & Prod: ₹${Number(q.manufacturingCost).toLocaleString('en-IN')}\n`;
    if (Number(q.inventoryCost) > 0) breakdown += `- Inventory & Purchase: ₹${Number(q.inventoryCost).toLocaleString('en-IN')}\n`;
    if (Number(q.salesCost) > 0) breakdown += `- Sales & Dispatch: ₹${Number(q.salesCost).toLocaleString('en-IN')}\n`;
    if (Number(q.hrCost) > 0) breakdown += `- HR & Payroll: ₹${Number(q.hrCost).toLocaleString('en-IN')}\n`;
    if (Number(q.reportsCost) > 0) breakdown += `- Reports & Access: ₹${Number(q.reportsCost).toLocaleString('en-IN')}\n`;
    if (Number(q.deploymentCost) > 0) breakdown += `- Deployment & Training: ₹${Number(q.deploymentCost).toLocaleString('en-IN')}\n`;
    if (Number(q.specialProjectPrice) > 0) breakdown += `- Special Project Price: ₹${Number(q.specialProjectPrice).toLocaleString('en-IN')}\n`;

    const text = `Hello ${q.contactPerson},

Please find the detailed overview for your quotation (*${q.quotationNumber}*) below:

*Project:* ERP Implementation for ${q.clientName}
*Date:* ${new Date(q.quotationDate).toLocaleDateString('en-IN')}
*Valid Until:* ${new Date(q.validityDate).toLocaleDateString('en-IN')}

*Commercial Breakdown:*
${breakdown}
*Total Estimated Value: ₹${totalCost.toLocaleString('en-IN')}*
*(Annual Maintenance AMC: ₹${(Number(q.amcCost) || 0).toLocaleString('en-IN')}/year)*

We have also generated the official PDF quotation. Please let us know if you have any questions or require modifications.

Best regards,
*DZ Infotech*`;

    const encodedText = encodeURIComponent(text);
    const phone = q.clientPhone?.replace(/\D/g, '') || '';
    const url = `https://wa.me/${phone}?text=${encodedText}`;

    window.open(url, '_blank');
    closeWhatsAppPrompt();
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
          className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'create'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-700 hover:text-slate-900'
            }`}
          onClick={() => setActiveTab('create')}
        >
          Create Quotation
        </button>
        <button
          className={`px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'saved'
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
              <Select
                label="Client Company Name"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                required
              >
                <option value="">Select or type client name...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.companyName}>
                    {client.companyName}
                  </option>
                ))}
              </Select>
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
                          variant="secondary"
                          size="sm"
                          className="hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                          disabled={downloadingId === quotation.id}
                          onClick={() => handleDownload(quotation)}
                        >
                          {downloadingId === quotation.id ? 'Generating...' : 'Download PDF'}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                          onClick={() => {
                            setGeneratedQuotation(quotation);
                            setShowWhatsAppConfirm(true);
                          }}
                        >
                          <WhatsAppIcon className="h-4 w-4" />
                          Send via WhatsApp
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
        message={`Are you sure you want to delete quotation ${deleteItem?.quotationNumber}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />

      <ConfirmModal
        open={showWhatsAppConfirm}
        title="Send via WhatsApp"
        message={
          <>
            Send this quotation directly to <strong className="font-bold">{generatedQuotation?.contactPerson || 'the client'} ({generatedQuotation?.clientPhone || 'No phone number'})</strong> via WhatsApp?
          </>
        }
        confirmText={
          <span className="flex items-center gap-2">
            <WhatsAppIcon className="h-5 w-5" />
            Send on WhatsApp
          </span>
        }
        confirmVariant="primary"
        confirmButtonClassName="!bg-[#25D366] hover:!bg-[#20bd5a] !border-[#25D366] text-white"
        onConfirm={handleSendWhatsApp}
        onCancel={closeWhatsAppPrompt}
      />
    </div>
  );
}
