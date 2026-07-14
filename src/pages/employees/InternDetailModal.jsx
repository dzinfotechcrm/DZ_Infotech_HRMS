import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { formatDate } from '../../utils/dateHelpers';
import { getDocumentDownloadUrl } from '../../utils/internPdfGenerator';
import toast from 'react-hot-toast';

export default function InternDetailModal({ intern, managers, open, onClose, onRegenerate, onClearSigned }) {
  const [clearingDoc, setClearingDoc] = useState(null);

  if (!intern) return null;

  const handleDownload = async (path, name) => {
    try {
      const url = await getDocumentDownloadUrl(path);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Failed to get download URL');
      }
    } catch (error) {
      toast.error('Error opening document');
    }
  };

  const hasSignedOffer = !!intern.signed_offer_letter_url;
  const hasSignedNDA = !!intern.signed_nda_url;
  const hasAnySigned = hasSignedOffer || hasSignedNDA;

  const statusColors = {
    'Active': 'bg-emerald-100 text-emerald-700',
    'Completed': 'bg-blue-100 text-blue-700',
    'Terminated': 'bg-rose-100 text-rose-700',
  };

  return (
    <Modal open={open} title="Intern Details" onClose={onClose} size="max-w-4xl">
      <div className="space-y-8 h-[75vh] overflow-y-auto px-2 pb-4">

        {/* Profile Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-100 text-xl font-bold text-primary-700 ring-4 ring-white shadow-sm">
              {intern.photo_url ? (
                <img src={intern.photo_url} alt={intern.first_name} className="h-full w-full object-cover" />
              ) : (
                `${intern.first_name?.[0] || ''}${intern.full_name?.split(' ')?.[1]?.[0] || ''}`
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{intern.full_name}</h3>
              <p className="text-sm font-medium text-slate-500">{intern.position}</p>
            </div>
          </div>
          <div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusColors[intern.status] || 'bg-slate-100 text-slate-600'}`}>
              {intern.status}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid gap-8 sm:grid-cols-2">

          {/* Identity & Contact */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Identity & Contact</h4>
            <div className="space-y-3">
              <div><p className="text-xs font-medium text-slate-500">Email</p><p className="text-sm text-slate-900">{intern.email}</p></div>
              <div><p className="text-xs font-medium text-slate-500">Phone</p><p className="text-sm text-slate-900">{intern.phone || '—'}</p></div>
              <div><p className="text-xs font-medium text-slate-500">Address</p>
                <p className="text-sm text-slate-900">
                  {intern.address ? (typeof intern.address === 'string' ? intern.address : `${intern.address.line1 || ''}, ${intern.address.city || ''}, ${intern.address.state || ''} - ${intern.address.pincode || ''}`.replace(/^[,\s-]+|[,\s-]+$/g, '')) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Internship Details */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Internship Details</h4>
            <div className="space-y-3">
              <div><p className="text-xs font-medium text-slate-500">Duration</p><p className="text-sm text-slate-900">{formatDate(intern.start_date)} to {formatDate(intern.end_date)} ({intern.duration_text})</p></div>
              <div><p className="text-xs font-medium text-slate-500">Work Mode & Hours</p><p className="text-sm text-slate-900">{intern.work_mode} • {intern.working_days} • {intern.working_hours}</p></div>
              <div>
                <p className="text-xs font-medium text-slate-500">Compensation</p>
                <p className="text-sm text-slate-900">{intern.is_paid ? `Paid (Rs. ${intern.stipend_amount}/mo)` : 'Unpaid'}</p>
              </div>
              <div><p className="text-xs font-medium text-slate-500">Certificate Eligible</p><p className="text-sm text-slate-900">{intern.certificate_eligible ? 'Yes' : 'No'}</p></div>
            </div>
          </div>
        </div>

        {/* Bank Details Section */}
        {intern.is_paid && (intern.bank_name || intern.ifsc_code || intern.upi_id) && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Bank & UPI Details</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs font-medium text-slate-500">Bank Name</p><p className="text-sm text-slate-900">{intern.bank_name || '—'}</p></div>
              <div><p className="text-xs font-medium text-slate-500">IFSC Code</p><p className="text-sm text-slate-900">{intern.ifsc_code || '—'}</p></div>
              <div><p className="text-xs font-medium text-slate-500">Account Number</p><p className="text-sm text-slate-900">{intern.bank_account || '—'}</p></div>
              <div><p className="text-xs font-medium text-slate-500">UPI ID</p><p className="text-sm text-slate-900">{intern.upi_id || '—'}</p></div>
              {intern.upi_qr_code_url && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-slate-500 mb-2">UPI QR Code</p>
                  <a href={intern.upi_qr_code_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    View Uploaded QR
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents Section */}
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
            <h4 className="text-sm font-semibold text-slate-900">Legal Documents</h4>
            {!hasAnySigned && (
              <Button size="sm" variant="secondary" onClick={() => onRegenerate(intern.id)}>
                Regenerate Original PDFs
              </Button>
            )}
            {hasAnySigned && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Regeneration disabled (signed docs exist)</span>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Offer Letter Block */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h5 className="font-semibold text-slate-800 mb-2">Offer Letter</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Generated PDF:</span>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(intern.offer_letter_pdf_url)}>View</Button>
                </div>
                {hasSignedOffer ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-medium text-emerald-600">Signed Copy:</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleDownload(intern.signed_offer_letter_url)}>View</Button>
                      <Button size="sm" variant="danger" onClick={() => setClearingDoc('signed_offer_letter_url')}>Clear</Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 text-sm text-slate-400 italic">No signed copy uploaded yet.</div>
                )}
              </div>
            </div>

            {/* NDA Block */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h5 className="font-semibold text-slate-800 mb-2">Non-Disclosure Agreement</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Generated PDF:</span>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(intern.nda_pdf_url)}>View</Button>
                </div>
                {hasSignedNDA ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-sm font-medium text-emerald-600">Signed Copy:</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => handleDownload(intern.signed_nda_url)}>View</Button>
                      <Button size="sm" variant="danger" onClick={() => setClearingDoc('signed_nda_url')}>Clear</Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 text-sm text-slate-400 italic">No signed copy uploaded yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="border-t border-slate-200 pt-4 mt-6">
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>

      <ConfirmModal
        open={!!clearingDoc}
        title="Clear Document"
        message="Are you sure you want to clear this signed document? This action cannot be undone and intern need to re-upload the document."
        confirmText="Clear"
        confirmVariant="danger"
        onConfirm={() => {
          if (clearingDoc) {
            onClearSigned(intern.id, clearingDoc);
            setClearingDoc(null);
          }
        }}
        onCancel={() => setClearingDoc(null)}
      />
    </Modal>
  );
}
