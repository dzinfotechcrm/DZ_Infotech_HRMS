import React, { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import InternshipCertificatePDF from './InternshipCertificatePDF';
import { formatDate } from '../../utils/dateHelpers';
import { openPdfInNewTab, downloadPdfBlob, viewPdfWithProperName } from '../../utils/internPdfGenerator';
import toast from 'react-hot-toast';

export default function CertificateCustomModal({ open, onClose, intern }) {
  const [loadingAction, setLoadingAction] = useState(null); // 'view' | 'download' | null

  const todayStr = formatDate(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    certificate_title: 'INTERNSHIP COMPLETION CERTIFICATE',
    is_summer: false,
    project_title: '',
    college_name: '',
    degree_branch: '',
    certificate_no: '',
    start_date: todayStr,
    end_date: todayStr,
    issue_date: todayStr,
    signatory_name: 'Soumyarajsinh Zala',
    signatory_designation: 'Co-Founder',
  });

  useEffect(() => {
    if (intern && open) {
      const isSummerDefault = (intern.duration || '').toLowerCase().includes('summer') ||
        (intern.notes || '').toLowerCase().includes('summer');

      const defaultProject = intern.project_title ||
        intern.data?.project_title ||
        intern.position_domain ||
        intern.position ||
        'Full Stack Web Development';

      setFormData({
        certificate_title: isSummerDefault
          ? 'SUMMER INTERNSHIP COMPLETION CERTIFICATE'
          : 'INTERNSHIP COMPLETION CERTIFICATE',
        is_summer: isSummerDefault,
        project_title: defaultProject,
        college_name: intern.college_name || intern.data?.college_name || '',
        degree_branch: intern.degree_branch || intern.data?.degree_branch || '',
        certificate_no: intern.certificate_no || '',
        start_date: intern.start_date || todayStr,
        end_date: intern.end_date || todayStr,
        issue_date: intern.certificate_date || intern.end_date || todayStr,
        signatory_name: intern.signatory_name || 'Soumyarajsinh Zala',
        signatory_designation: intern.signatory_designation || 'Co-Founder',
      });
    }
  }, [intern, open]);

  if (!intern || !open) return null;

  const getSafeFileName = () => {
    const rawName = (intern.full_name || `${intern.first_name || ''} ${intern.last_name || ''}`).trim() || 'Intern';
    const safeName = rawName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
    return `${safeName}_Internship_Certificate.pdf`;
  };

  const handleGenerate = async (actionType) => {
    setLoadingAction(actionType);
    const fileName = getSafeFileName();
    const toastId = toast.loading(`${actionType === 'view' ? 'Opening' : 'Generating'} ${fileName}...`);

    try {
      const doc = (
        <InternshipCertificatePDF
          intern={intern}
          options={{
            fileName,
            certificate_title: formData.certificate_title,
            is_summer: formData.is_summer,
            project_title: formData.project_title,
            college_name: formData.college_name,
            degree_branch: formData.degree_branch,
            certificate_no: formData.certificate_no,
            start_date: formData.start_date,
            end_date: formData.end_date,
            issue_date: formData.issue_date,
            signatory_name: formData.signatory_name,
            signatory_designation: formData.signatory_designation,
          }}
        />
      );

      const blob = await pdf(doc).toBlob();

      if (actionType === 'view') {
        await viewPdfWithProperName({ blob, fileName, internId: intern.id });
        toast.success(`${fileName} opened in new tab`, { id: toastId });
      } else {
        downloadPdfBlob(blob, fileName);
        toast.success(`${fileName} downloaded successfully`, { id: toastId });
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate certificate', { id: toastId });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Modal open={open} title="Generate Internship Completion Certificate" onClose={onClose} maxWidth="720px">
      <div className="space-y-5 px-1 py-2">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recipient</p>
            <p className="text-sm font-bold text-slate-900">
              {intern.full_name || `${intern.first_name || ''} ${intern.last_name || ''}`}
            </p>
          </div>
          <span className="text-xs bg-primary-100 text-primary-800 font-semibold px-2.5 py-1 rounded-full">
            DZ Infotech Certificate
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Select
              label="Certificate Type / Heading"
              value={formData.is_summer ? 'summer' : 'regular'}
              onChange={(e) => {
                const isSummer = e.target.value === 'summer';
                setFormData((prev) => ({
                  ...prev,
                  is_summer: isSummer,
                  certificate_title: isSummer
                    ? 'SUMMER INTERNSHIP COMPLETION CERTIFICATE'
                    : 'INTERNSHIP COMPLETION CERTIFICATE',
                }));
              }}
            >
              <option value="regular">Standard Internship Completion Certificate</option>
              <option value="summer">Summer Internship Completion Certificate</option>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Input
              label="Project Title / Domain (Appears in certificate quotes)"
              placeholder="e.g. Full Stack Web Development or Project Name"
              value={formData.project_title}
              onChange={(e) => setFormData((prev) => ({ ...prev, project_title: e.target.value }))}
              required
            />
          </div>

          <Input
            label="College / University Name (Optional)"
            placeholder="e.g. Chandubhai S. Patel Institute of Technology, CHARUSAT, Changa"
            value={formData.college_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, college_name: e.target.value }))}
          />

          <Input
            label="Degree / Branch (Optional)"
            placeholder="e.g. B.Tech (CSE)"
            value={formData.degree_branch}
            onChange={(e) => setFormData((prev) => ({ ...prev, degree_branch: e.target.value }))}
          />

          <Input
            label="Certificate Number (Optional)"
            placeholder="e.g. DZI/CERT/2026/084 (Auto-generated if left blank)"
            value={formData.certificate_no}
            onChange={(e) => setFormData((prev) => ({ ...prev, certificate_no: e.target.value }))}
          />

          <Input
            label="Certificate Issue Date"
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, issue_date: e.target.value }))}
            required
          />

          <Input
            label="Internship Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
            required
          />

          <Input
            label="Internship End Date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
            required
          />

          <Input
            label="Signatory Name"
            placeholder="e.g. Soumyarajsinh Zala"
            value={formData.signatory_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, signatory_name: e.target.value }))}
            required
          />

          <div className="sm:col-span-2">
            <Input
              label="Signatory Designation"
              placeholder="e.g. Co-Founder"
              value={formData.signatory_designation}
              onChange={(e) => setFormData((prev) => ({ ...prev, signatory_designation: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={!!loadingAction}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGenerate('view')}
            loading={loadingAction === 'view'}
            disabled={!!loadingAction}
          >
            Preview in New Tab
          </Button>
          <Button
            variant="primary"
            onClick={() => handleGenerate('download')}
            loading={loadingAction === 'download'}
            disabled={!!loadingAction}
          >
            Download Certificate PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}
