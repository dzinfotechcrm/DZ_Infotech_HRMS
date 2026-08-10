import React, { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotationPDF } from '../../../components/pdf/QuotationPDF';

const getInitialState = () => ({
  clientName: '',
  contactPerson: '',
  quotationNumber: `QT-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-A`,
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
});

export default function CompanyQuotations() {
  const [formData, setFormData] = useState(getInitialState());

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'gstin' ? value.toUpperCase() : value 
    }));
  };

  const handleReset = () => {
    // Add a small delay to ensure the PDF download starts before clearing the data
    setTimeout(() => {
      setFormData(getInitialState());
    }, 500);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Quotations" description="Generate and manage company quotations" />
      
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
          <PDFDownloadLink
            document={<QuotationPDF data={formData} />}
            fileName={`${formData.quotationNumber}_${formData.clientName.replace(/\s+/g, '_') || 'Draft'}_Quotation.pdf`}
          >
            {({ loading }) => (
              <Button type="button" variant="primary" disabled={loading || !formData.clientName} onClick={handleReset}>
                {loading ? 'Generating PDF...' : 'Download Quotation PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </Card>
    </div>
  );
}
