import { useState, useMemo } from 'react';
import { pdf, PDFDownloadLink } from '@react-pdf/renderer';
import {
  AcademicCapIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CalendarDaysIcon,
  BuildingLibraryIcon,
  UserIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Spinner from '../../components/ui/Spinner';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { createDocument, updateDocument, removeDocument, query, orderBy } from '../../supabase/db';
import { supabase } from '../../supabase/config';
import { formatDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

import InternshipProgramModal from './InternshipProgramModal';
import InternshipProgramOfferLetterPDF from '../../components/pdf/InternshipProgramOfferLetterPDF';
import InternshipProgramNDAPDF from '../../components/pdf/InternshipProgramNDAPDF';

const STATUS_TONES = {
  'Offer Issued': 'accent',
  'NDA Signed': 'primary',
  'Active': 'success',
  'Completed': 'neutral',
  'Terminated': 'danger',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Offer Issued', label: 'Offer Issued' },
  { value: 'NDA Signed', label: 'NDA Signed' },
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Terminated', label: 'Terminated' },
];

const DURATION_FILTERS = [
  { value: 'all', label: 'All Durations' },
  { value: '3', label: '3 Months' },
  { value: '6', label: '6 Months' },
];

export default function InternshipProgramList() {
  const collectionQuery = useMemo(() => (base) => query(base, orderBy('created_at', 'desc')), []);
  const { items: interns, loading, refetch } = useSupabaseCollection('internship_program', collectionQuery);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Filtered interns
  const filteredInterns = useMemo(() => {
    return interns.filter((item) => {
      const matchSearch =
        search === '' ||
        (item.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.college_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (item.position_domain || '').toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchDuration =
        durationFilter === 'all' || (item.duration || '').includes(durationFilter);

      return matchSearch && matchStatus && matchDuration;
    });
  }, [interns, search, statusFilter, durationFilter]);

  // Metric stats
  const metrics = useMemo(() => {
    const total = interns.length;
    const active = interns.filter((i) => i.status === 'Active' || i.status === 'Offer Issued' || i.status === 'NDA Signed').length;
    const threeMonth = interns.filter((i) => (i.duration || '').includes('3')).length;
    const sixMonth = interns.filter((i) => (i.duration || '').includes('6')).length;
    return { total, active, threeMonth, sixMonth };
  }, [interns]);

  // Handlers
  const handleOpenAdd = () => {
    setSelectedIntern(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (intern) => {
    setSelectedIntern(intern);
    setFormModalOpen(true);
  };

  // Background sync helper to save generated PDFs to Supabase Storage 'intern_documents'
  const uploadDocumentsToStorage = async (internRecord) => {
    if (!internRecord?.id) return;
    try {
      const rawName = (internRecord.full_name || 'Intern').trim();
      const safeName = rawName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      const offerPath = `${internRecord.id}/${safeName}_Offer_Letter.pdf`;
      const ndaPath = `${internRecord.id}/${safeName}_NDA.pdf`;

      const [offerBlob, ndaBlob] = await Promise.all([
        pdf(<InternshipProgramOfferLetterPDF intern={internRecord} />).toBlob(),
        pdf(<InternshipProgramNDAPDF intern={internRecord} />).toBlob(),
      ]);

      await Promise.all([
        supabase.storage.from('intern_documents').upload(offerPath, offerBlob, {
          contentType: 'application/pdf',
          upsert: true,
        }),
        supabase.storage.from('intern_documents').upload(ndaPath, ndaBlob, {
          contentType: 'application/pdf',
          upsert: true,
        }),
      ]);
    } catch (err) {
      console.warn('Background document sync to storage:', err);
    }
  };

  const handleSaveIntern = async (data) => {
    try {
      let savedRecord;
      if (selectedIntern) {
        savedRecord = await updateDocument('internship_program', selectedIntern.id, data);
        toast.success('Intern details updated successfully');
      } else {
        savedRecord = await createDocument('internship_program', data);
        toast.success('Intern added to program & documents ready!');
      }
      refetch();
      if (savedRecord) {
        uploadDocumentsToStorage(savedRecord);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save intern');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeDocument('internship_program', deleteId);
      toast.success('Intern removed from program');
      setDeleteId(null);
      refetch();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete intern');
    }
  };

  // Open PDF in a new browser tab with proper name
  const handleViewPdf = async (intern, type) => {
    const rawName = (intern.full_name || 'Intern').trim();
    const safeName = rawName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const docSuffix = type === 'offer' ? 'Offer_Letter' : 'NDA';
    const fileName = `${safeName}_${docSuffix}.pdf`;
    const filePath = `${intern.id}/${fileName}`;

    const toastId = toast.loading(`Preparing ${fileName}...`);
    try {
      // 1. Always generate fresh PDF blob from latest component
      const doc = type === 'offer' ? (
        <InternshipProgramOfferLetterPDF intern={intern} />
      ) : (
        <InternshipProgramNDAPDF intern={intern} />
      );
      const blob = await pdf(doc).toBlob();

      // 2. Upload/refresh in Supabase Storage with upsert: true
      let signedUrl = null;
      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('intern_documents')
          .upload(filePath, blob, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (!uploadErr && uploadData?.path) {
          const { data: signedData } = await supabase.storage
            .from('intern_documents')
            .createSignedUrl(uploadData.path, 60 * 60);
          if (signedData?.signedUrl) {
            signedUrl = signedData.signedUrl;
          }
        }
      } catch (storageErr) {
        console.warn('Storage upload fallback:', storageErr);
      }

      // 3. Open in new browser tab
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        // Fallback: If storage is unreachable, open Blob URL in new window with filename
        const file = new File([blob], fileName, { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(file);
        const newTab = window.open(blobUrl, '_blank');
        if (newTab) {
          newTab.document.title = fileName;
        }
      }

      toast.success(`${fileName} opened in new tab`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to open ${fileName}`, { id: toastId });
    }
  };

  // Download PDF directly with proper filename
  const handleDownloadPdf = async (intern, type) => {
    const rawName = (intern.full_name || 'Intern').trim();
    const safeName = rawName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    const docSuffix = type === 'offer' ? 'Offer_Letter' : 'NDA';
    const fileName = `${safeName}_${docSuffix}.pdf`;

    const toastId = toast.loading(`Downloading ${fileName}...`);
    try {
      const doc = type === 'offer' ? (
        <InternshipProgramOfferLetterPDF intern={intern} />
      ) : (
        <InternshipProgramNDAPDF intern={intern} />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`${fileName} downloaded!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to download ${fileName}`, { id: toastId });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="HRMS"
        title="Internship Program"
        description="Dedicated industrial internship management. Onboard students, configure project durations, and automatically generate official Offer Letters and Student NDAs matching the DZ Infotech template."
        actions={
          <Button onClick={handleOpenAdd} className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            <span>Add Intern</span>
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-primary-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Enrolled</p>
              <p className="text-2xl font-bold text-neutral-900 mt-1">{metrics.total}</p>
            </div>
            <div className="rounded-xl bg-primary-50 p-2.5 text-primary-600">
              <AcademicCapIcon className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Active / In Progress</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics.active}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">3 Months</p>
              <p className="text-2xl font-bold text-sky-600 mt-1">{metrics.threeMonth}</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600">
              <CalendarDaysIcon className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">6 Months</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{metrics.sixMonth}</p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <BuildingLibraryIcon className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, college, email, or domain..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-primary-500"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-neutral-300 bg-white focus:outline-none focus:border-primary-500"
            >
              {DURATION_FILTERS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Interns Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center justify-center gap-3">
            <Spinner className="h-8 w-8 text-primary-600" />
            <p className="text-sm">Loading internship program students...</p>
          </div>
        ) : filteredInterns.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 flex flex-col items-center justify-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-400">
              <AcademicCapIcon className="h-8 w-8" />
            </div>
            <div>
              <p className="font-semibold text-neutral-800">No interns found</p>
              <p className="text-xs text-neutral-500 mt-1">
                {search || statusFilter !== 'all' || durationFilter !== 'all'
                  ? 'Try clearing your search or filter criteria.'
                  : 'Get started by adding your first student intern to the program.'}
              </p>
            </div>
            {!search && statusFilter === 'all' && (
              <Button onClick={handleOpenAdd} size="sm" className="mt-2">
                + Add First Intern
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-xs font-bold uppercase text-neutral-600">
                <tr>
                  <th className="py-3 px-4">Student & College</th>
                  <th className="py-3 px-4">Domain & Duration</th>
                  <th className="py-3 px-4">Tenure Dates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Generated Documents</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredInterns.map((item) => {
                  const tone = STATUS_TONES[item.status] || 'neutral';
                  return (
                    <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Candidate Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0">
                            {(item.full_name || 'I').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900">
                              <span className="text-neutral-500 font-medium mr-1">
                                {(item.gender || '').toLowerCase() === 'female' ? 'Ms.' : 'Mr.'}
                              </span>
                              {item.full_name}
                            </p>
                            <p className="text-xs text-neutral-500">{item.college_name}</p>
                            <p className="text-[11px] text-neutral-400">{item.degree_branch}</p>
                          </div>
                        </div>
                      </td>

                      {/* Domain & Duration */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-neutral-800">{item.position_domain}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            {(item.duration || '').toLowerCase().includes('6') ? '6 Months' : '3 Months'}
                          </span>
                          <span className="text-xs text-neutral-500">{item.work_mode?.split('/')[0]}</span>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-neutral-700">
                          <p><span className="text-neutral-400">Start:</span> {formatDate(item.start_date)}</p>
                          <p><span className="text-neutral-400">End:</span> {formatDate(item.end_date)}</p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge tone={tone}>{item.status || 'Offer Issued'}</Badge>
                      </td>

                      {/* Documents (Offer Letter & NDA) */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          {/* Offer Letter Actions */}
                          <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-white shadow-xs">
                            <button
                              onClick={() => handleViewPdf(item, 'offer')}
                              title="View Offer Letter in New Tab"
                              className="px-2 py-1 text-xs font-semibold text-neutral-700 hover:text-primary-700 hover:bg-neutral-50 rounded flex items-center gap-1 transition"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                              <span>Offer</span>
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(item, 'offer')}
                              title="Download Offer Letter PDF"
                              className="p-1 text-primary-600 hover:bg-primary-50 rounded transition"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            </button>
                          </div>

                          {/* NDA Actions */}
                          <div className="inline-flex rounded-lg border border-neutral-200 p-0.5 bg-white shadow-xs">
                            <button
                              onClick={() => handleViewPdf(item, 'nda')}
                              title="View Student NDA in New Tab"
                              className="px-2 py-1 text-xs font-semibold text-neutral-700 hover:text-primary-700 hover:bg-neutral-50 rounded flex items-center gap-1 transition"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                              <span>NDA</span>
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(item, 'nda')}
                              title="Download Student NDA PDF"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Details"
                            className="p-1.5 text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 rounded-lg transition"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            title="Delete Intern"
                            className="p-1.5 text-neutral-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Form Modal */}
      <InternshipProgramModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        intern={selectedIntern}
        onSave={handleSaveIntern}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Intern from Internship Program?"
        message="Are you sure you want to delete this intern record? This will permanently remove their application and associated document records."
        confirmText="Delete Intern"
        danger
      />
    </div>
  );
}
