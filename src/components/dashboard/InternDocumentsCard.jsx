import { useState, useRef } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { supabase } from '../../supabase/config';
import { getDocumentDownloadUrl } from '../../utils/internPdfGenerator';
import { updateDocument } from '../../supabase/db';
import toast from 'react-hot-toast';
import { DocumentTextIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export default function InternDocumentsCard({ intern, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const offerInputRef = useRef(null);
  const ndaInputRef = useRef(null);

  const handleDownload = async (path, name) => {
    try {
      const url = await getDocumentDownloadUrl(path);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Document not available yet');
      }
    } catch (error) {
      toast.error('Error opening document');
    }
  };

  const handleUpload = async (event, docType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading document...');

    try {
      const firstName = (intern.first_name || 'First').trim().replace(/\s+/g, '_');
      const lastName = (intern.last_name || 'Last').trim().replace(/\s+/g, '_');
      const safeName = `${firstName}_${lastName}`;
      const fileName = docType === 'offer_letter' 
          ? `${safeName}_Signed_Offer_Letter.pdf` 
          : `${safeName}_Signed_NDA.pdf`;
      const filePath = `${intern.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('intern_documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const updatePayload = {
        [docType === 'offer_letter' ? 'signed_offer_letter_url' : 'signed_nda_url']: data.path,
      };

      await updateDocument('interns', intern.id, updatePayload);
      toast.success('Document uploaded successfully!', { id: toastId });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to upload document', { id: toastId });
    } finally {
      setUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  if (!intern) return null;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5 text-primary-500" />
            My Internship Documents
          </h2>
          <p className="text-sm text-slate-500">Download your original offer letter and NDA, and upload the signed copies.</p>
        </div>
        <Badge tone={intern.signed_offer_letter_url && intern.signed_nda_url ? 'success' : 'warning'}>
          {intern.signed_offer_letter_url && intern.signed_nda_url ? 'All Signed' : 'Action Required'}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Offer Letter */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <h4 className="font-semibold text-slate-800 mb-4">Offer Letter</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 font-medium">Original PDF</span>
              <Button 
                size="sm" 
                variant="secondary" 
                className="gap-1 bg-white hover:bg-slate-100"
                disabled={!intern.offer_letter_pdf_url}
                onClick={() => handleDownload(intern.offer_letter_pdf_url)}
              >
                <ArrowDownTrayIcon className="h-4 w-4" /> Download
              </Button>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <span className="text-sm text-slate-600 font-medium block mb-3">Signed Copy</span>
              {intern.signed_offer_letter_url ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-100">
                  <span className="text-sm text-emerald-700 font-medium flex items-center gap-1">
                    <DocumentTextIcon className="h-4 w-4" /> Uploaded successfully
                  </span>
                  <Button size="sm" variant="secondary" className="bg-white text-emerald-700 hover:bg-emerald-100 border-emerald-200" onClick={() => handleDownload(intern.signed_offer_letter_url)}>
                    View
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => offerInputRef.current?.click()}>
                  <ArrowUpTrayIcon className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-primary-600 hover:text-primary-700">Click to upload signed Offer Letter</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF format only, max 5MB</p>
                  <input type="file" className="hidden" accept="application/pdf" ref={offerInputRef} onChange={(e) => handleUpload(e, 'offer_letter')} disabled={uploading} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NDA */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <h4 className="font-semibold text-slate-800 mb-4">Non-Disclosure Agreement (NDA)</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 font-medium">Original PDF</span>
              <Button 
                size="sm" 
                variant="secondary" 
                className="gap-1 bg-white hover:bg-slate-100"
                disabled={!intern.nda_pdf_url}
                onClick={() => handleDownload(intern.nda_pdf_url)}
              >
                <ArrowDownTrayIcon className="h-4 w-4" /> Download
              </Button>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <span className="text-sm text-slate-600 font-medium block mb-3">Signed Copy</span>
              {intern.signed_nda_url ? (
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 border border-emerald-100">
                  <span className="text-sm text-emerald-700 font-medium flex items-center gap-1">
                    <DocumentTextIcon className="h-4 w-4" /> Uploaded successfully
                  </span>
                  <Button size="sm" variant="secondary" className="bg-white text-emerald-700 hover:bg-emerald-100 border-emerald-200" onClick={() => handleDownload(intern.signed_nda_url)}>
                    View
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => ndaInputRef.current?.click()}>
                  <ArrowUpTrayIcon className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-primary-600 hover:text-primary-700">Click to upload signed NDA</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF format only, max 5MB</p>
                  <input type="file" className="hidden" accept="application/pdf" ref={ndaInputRef} onChange={(e) => handleUpload(e, 'nda')} disabled={uploading} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
