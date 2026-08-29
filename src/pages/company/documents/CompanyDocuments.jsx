import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';
import { DocumentIcon, TrashIcon, ArrowDownTrayIcon, EyeIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { uploadFile } from '../../../supabase/storage';
import { useSupabaseCollection } from '../../../hooks/useSupabase';
import { createDocument, removeDocument, query, where } from '../../../supabase/db';

const initialDocs = [];

export default function CompanyDocuments() {
  const [pptFile, setPptFile] = useState(null);
  const [catalogueFile, setCatalogueFile] = useState(null);
  const companyDocsQuery = useMemo(() => (base) => query(base, where('employeeId', '==', 'company')), []);
  const { items: rawDocuments, refetch, loading } = useSupabaseCollection('documents', companyDocsQuery);
  
  const documents = useMemo(() => {
    return rawDocuments.map(doc => ({
      id: doc.id,
      name: doc.fileName || doc.name,
      type: doc.docType === 'Company PPT' ? 'PPT' : 'Catalogue',
      uploadDate: (doc.createdAt || new Date().toISOString()).split('T')[0],
      size: doc.fileSize ? (doc.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : doc.size || 'Unknown',
      url: doc.fileURL || doc.url
    }));
  }, [rawDocuments]);

  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteDocId, setDeleteDocId] = useState(null);

  const handlePptUpload = async (e) => {
    e.preventDefault();
    if (!pptFile) {
      toast.error('Please select a PPT file to upload');
      return;
    }
    const toastId = toast.loading('Uploading PPT...');
    try {
      const fileUrl = await uploadFile(pptFile, 'company_documents');
      const newDoc = {
        employee_id: 'company',
        data: {
          docType: 'Company PPT',
          fileName: pptFile.name,
          fileURL: fileUrl,
          fileSize: pptFile.size,
        }
      };
      await createDocument('documents', newDoc);
      refetch();
      toast.success('PPT uploaded successfully', { id: toastId });
      setPptFile(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload PPT', { id: toastId });
    }
  };

  const handleCatalogueUpload = async (e) => {
    e.preventDefault();
    if (!catalogueFile) {
      toast.error('Please select a catalogue file to upload');
      return;
    }
    const toastId = toast.loading('Uploading Catalogue...');
    try {
      const fileUrl = await uploadFile(catalogueFile, 'company_documents');
      const newDoc = {
        employee_id: 'company',
        data: {
          docType: 'Company Catalogue',
          fileName: catalogueFile.name,
          fileURL: fileUrl,
          fileSize: catalogueFile.size,
        }
      };
      await createDocument('documents', newDoc);
      refetch();
      toast.success('Service Catalogue uploaded successfully', { id: toastId });
      setCatalogueFile(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload Catalogue', { id: toastId });
    }
  };

  const handleView = (doc) => {
    setPreviewDoc(doc);
  };

  const handleDownload = async (doc) => {
    if (doc.url) {
      try {
        const toastId = toast.loading(`Preparing download...`);
        const response = await fetch(doc.url);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.dismiss(toastId);
      } catch (error) {
        console.error('Download error:', error);
        // Fallback if fetch fails
        const a = document.createElement('a');
        a.href = `${doc.url}?download=${encodeURIComponent(doc.name)}`;
        a.download = doc.name;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } else {
      toast(`Downloading ${doc.name} (Mock data)`, { icon: '⬇️' });
    }
  };

  const handleDelete = (id) => {
    setDeleteDocId(id);
  };

  const confirmDelete = async () => {
    if (deleteDocId) {
      try {
        await removeDocument('documents', deleteDocId);
        refetch();
        toast.success('Document deleted successfully');
      } catch (e) {
        toast.error('Failed to delete document');
      }
      setDeleteDocId(null);
    }
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
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${doc.type === 'PPT' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
          }`}>
          {doc.type}
        </span>
      </td>
      <td className="px-4 py-3 text-neutral-500">{doc.uploadDate}</td>
      <td className="px-4 py-3 text-neutral-500">{doc.size}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => handleView(doc)} className="p-1.5 text-neutral-400 hover:text-primary-600 transition" title="View">
            <EyeIcon className="h-4 w-4" />
          </button>
          <button onClick={() => handleDownload(doc)} className="p-1.5 text-neutral-400 hover:text-primary-600 transition" title="Download">
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
            <div className="relative group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl bg-neutral-50 hover:bg-primary-50 hover:border-primary-400 transition-colors cursor-pointer overflow-hidden">
              <input
                type="file"
                accept=".ppt,.pptx"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const name = file.name.toLowerCase();
                    if (name.endsWith('.ppt') || name.endsWith('.pptx')) {
                      setPptFile(file);
                    } else {
                      toast.error('Only PPT files (.ppt, .pptx) are allowed');
                      e.target.value = null;
                      setPptFile(null);
                    }
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <CloudArrowUpIcon className="h-8 w-8 text-neutral-400 group-hover:text-primary-500 mb-2 transition-colors" />
              <span className="text-sm font-medium text-neutral-600 group-hover:text-primary-600 px-4 text-center truncate w-full">
                {pptFile ? pptFile.name : "Click or drag to select PPT"}
              </span>
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={!pptFile}>
              Upload PPT
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Upload Service Catalogue</h3>
          <form onSubmit={handleCatalogueUpload} className="space-y-4">
            <div className="relative group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl bg-neutral-50 hover:bg-primary-50 hover:border-primary-400 transition-colors cursor-pointer overflow-hidden">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const name = file.name.toLowerCase();
                    if (name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx')) {
                      setCatalogueFile(file);
                    } else {
                      toast.error('Only Catalogue files (.pdf, .doc, .docx) are allowed');
                      e.target.value = null;
                      setCatalogueFile(null);
                    }
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <CloudArrowUpIcon className="h-8 w-8 text-neutral-400 group-hover:text-primary-500 mb-2 transition-colors" />
              <span className="text-sm font-medium text-neutral-600 group-hover:text-primary-600 px-4 text-center truncate w-full">
                {catalogueFile ? catalogueFile.name : "Click or drag to select Catalogue"}
              </span>
            </div>
            <Button type="submit" variant="primary" className="w-full" disabled={!catalogueFile}>
              Upload Catalogue
            </Button>
          </form>
        </Card>
      </div>

      <div className="pt-4">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Uploaded Documents</h3>
        {loading ? (
           <div className="text-center py-8 text-neutral-500">Loading documents...</div>
        ) : (
           <Table columns={columns} data={documents} renderRow={renderRow} emptyMessage="No documents uploaded yet." />
        )}
      </div>

      <ConfirmModal
        open={!!deleteDocId}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDocId(null)}
        confirmText="Delete"
        confirmVariant="danger"
      />

      <Modal open={!!previewDoc} title={`Viewing: ${previewDoc?.name}`} onClose={() => setPreviewDoc(null)} maxWidth="95vw">
        {previewDoc?.url ? (
          <div className="h-[65vh] sm:h-[80vh] w-full rounded-lg overflow-hidden border border-neutral-200">
            {previewDoc.type === 'Catalogue' ? (
              <iframe src={`${previewDoc.url}#toolbar=0`} className="w-full h-full border-0" title="Document Preview" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-neutral-500 bg-neutral-50">
                <DocumentIcon className="h-16 w-16 text-neutral-400" />
                <p>This file type cannot be previewed directly in the browser.</p>
                <Button variant="outline" onClick={() => handleDownload(previewDoc)}>
                  Download to View
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-neutral-500 bg-neutral-50 rounded-lg border border-neutral-200 border-dashed">
            <DocumentIcon className="h-12 w-12 text-neutral-400" />
            <p>Preview is not available for mock documents.</p>
            <p className="text-sm">Please upload a real document to preview it.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
