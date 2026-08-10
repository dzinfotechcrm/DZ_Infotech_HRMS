import React, { useState } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import toast from 'react-hot-toast';
import { DocumentIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const initialDocs = [
  { id: 1, type: 'PPT', name: 'Company_Overview_2026.pptx', uploadDate: '2026-08-01', size: '2.4 MB' },
  { id: 2, type: 'Catalogue', name: 'Services_Catalogue_Q3.pdf', uploadDate: '2026-08-05', size: '1.1 MB' },
];

export default function CompanyDocuments() {
  const [pptFile, setPptFile] = useState(null);
  const [catalogueFile, setCatalogueFile] = useState(null);
  const [documents, setDocuments] = useState(initialDocs);

  const handlePptUpload = (e) => {
    e.preventDefault();
    if (!pptFile) {
      toast.error('Please select a PPT file to upload');
      return;
    }
    const newDoc = {
      id: Date.now(),
      type: 'PPT',
      name: pptFile.name,
      uploadDate: new Date().toISOString().split('T')[0],
      size: (pptFile.size / (1024 * 1024)).toFixed(2) + ' MB'
    };
    setDocuments(prev => [newDoc, ...prev]);
    toast.success('PPT uploaded successfully');
    setPptFile(null);
    e.target.reset();
  };

  const handleCatalogueUpload = (e) => {
    e.preventDefault();
    if (!catalogueFile) {
      toast.error('Please select a catalogue file to upload');
      return;
    }
    const newDoc = {
      id: Date.now(),
      type: 'Catalogue',
      name: catalogueFile.name,
      uploadDate: new Date().toISOString().split('T')[0],
      size: (catalogueFile.size / (1024 * 1024)).toFixed(2) + ' MB'
    };
    setDocuments(prev => [newDoc, ...prev]);
    toast.success('Service Catalogue uploaded successfully');
    setCatalogueFile(null);
    e.target.reset();
  };

  const handleDelete = (id) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    toast.success('Document deleted');
  };

  const columns = [
    { key: 'name', label: 'Document Name' },
    { key: 'type', label: 'Type' },
    { key: 'uploadDate', label: 'Upload Date' },
    { key: 'size', label: 'Size' },
    { key: 'actions', label: 'Actions' }
  ];

  const renderRow = (doc) => (
    <tr key={doc.id} className="hover:bg-neutral-50/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <DocumentIcon className="h-5 w-5 text-neutral-400" />
          <span className="font-medium text-neutral-900">{doc.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          doc.type === 'PPT' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {doc.type}
        </span>
      </td>
      <td className="px-4 py-3 text-neutral-500">{doc.uploadDate}</td>
      <td className="px-4 py-3 text-neutral-500">{doc.size}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-neutral-400 hover:text-primary-600 transition" title="Download">
            <ArrowDownTrayIcon className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-neutral-400 hover:text-danger-600 transition" title="Delete">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Company Documents" description="Manage company wide documents and templates" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Upload PPT</h3>
          <form onSubmit={handlePptUpload} className="space-y-4">
            <Input
              type="file"
              accept=".ppt,.pptx"
              onChange={(e) => setPptFile(e.target.files[0])}
            />
            <Button type="submit" variant="primary">
              Upload PPT
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Upload Service Catalogue</h3>
          <form onSubmit={handleCatalogueUpload} className="space-y-4">
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setCatalogueFile(e.target.files[0])}
            />
            <Button type="submit" variant="primary">
              Upload Catalogue
            </Button>
          </form>
        </Card>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Uploaded Documents</h3>
        <Table columns={columns} data={documents} renderRow={renderRow} emptyMessage="No documents uploaded yet." />
      </div>
    </div>
  );
}
