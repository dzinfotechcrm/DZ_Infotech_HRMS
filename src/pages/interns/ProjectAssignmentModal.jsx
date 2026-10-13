import { useState, useEffect, useMemo } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/dateHelpers';
import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'Completed', label: 'Completed' },
  { value: 'On Hold', label: 'On Hold' },
];

const COMMON_ROLES = [
  'Frontend Developer Intern',
  'Backend Developer Intern',
  'Full Stack Intern',
  'UI/UX Design Intern',
  'Mobile App Intern',
  'Python Developer Intern',
  'AI / ML Intern',
  'QA / Testing Intern',
];

export default function ProjectAssignmentModal({
  open,
  onClose,
  onSave,
  assignment = null,
  preselectedIntern = null,
  interns = [],
  employees = [],
  projects = [],
}) {
  const isEdit = Boolean(assignment?.id);
  const todayStr = formatDate(new Date(), 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    intern_id: '',
    intern_name: '',
    intern_role: '',
    project_id: '',
    project_name: '',
    mentor_id: '',
    mentor_name: '',
    start_date: todayStr,
    end_date: '',
    status: 'In Progress',
    whatsapp_number: '',
    description: '',
    whatsapp_notes: '',
  });

  const [customIntern, setCustomIntern] = useState(false);
  const [customProject, setCustomProject] = useState(false);
  const [customMentor, setCustomMentor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize or reset form
  useEffect(() => {
    if (!open) {
      setCopied(false);
      return;
    }

    if (assignment) {
      setFormData({
        intern_id: assignment.intern_id || assignment.internId || '',
        intern_name: assignment.intern_name || assignment.internName || '',
        intern_role: assignment.intern_role || assignment.internRole || '',
        project_id: assignment.project_id || assignment.projectId || '',
        project_name: assignment.project_name || assignment.projectName || '',
        mentor_id: assignment.mentor_id || assignment.mentorId || '',
        mentor_name: assignment.mentor_name || assignment.mentorName || '',
        start_date: assignment.start_date || assignment.startDate || todayStr,
        end_date: assignment.end_date || assignment.endDate || '',
        status: assignment.status || 'In Progress',
        whatsapp_number: assignment.whatsapp_number || assignment.whatsappNumber || '',
        description: assignment.description || '',
        whatsapp_notes: assignment.whatsapp_notes || assignment.whatsappNotes || '',
      });
      setCustomIntern(!assignment.intern_id && !assignment.internId && Boolean(assignment.intern_name || assignment.internName));
      setCustomProject(!assignment.project_id && !assignment.projectId && Boolean(assignment.project_name || assignment.projectName));
      setCustomMentor(!assignment.mentor_id && !assignment.mentorId && Boolean(assignment.mentor_name || assignment.mentorName));
    } else if (preselectedIntern) {
      const pName = preselectedIntern.full_name || `${preselectedIntern.first_name || ''} ${preselectedIntern.last_name || ''}`.trim() || preselectedIntern.name;
      const pRole = preselectedIntern.position || preselectedIntern.designation || 'Intern';
      const pPhone = preselectedIntern.phone || preselectedIntern.mobile || '';
      setFormData({
        intern_id: preselectedIntern.id || '',
        intern_name: pName,
        intern_role: pRole,
        project_id: '',
        project_name: '',
        mentor_id: '',
        mentor_name: '',
        start_date: todayStr,
        end_date: '',
        status: 'In Progress',
        whatsapp_number: pPhone,
        description: '',
        whatsapp_notes: '',
      });
      setCustomIntern(false);
      setCustomProject(false);
      setCustomMentor(false);
    } else {
      setFormData({
        intern_id: '',
        intern_name: '',
        intern_role: '',
        project_id: '',
        project_name: '',
        mentor_id: '',
        mentor_name: '',
        start_date: todayStr,
        end_date: '',
        status: 'In Progress',
        whatsapp_number: '',
        description: '',
        whatsapp_notes: '',
      });
      setCustomIntern(false);
      setCustomProject(false);
      setCustomMentor(false);
    }
  }, [open, assignment, preselectedIntern, todayStr]);

  // Handle intern dropdown selection
  const handleInternChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === '__custom__') {
      setCustomIntern(true);
      setFormData(prev => ({
        ...prev,
        intern_id: '',
        intern_name: '',
      }));
      return;
    }

    setCustomIntern(false);
    const found = interns.find(i => String(i.id) === String(selectedId));
    if (found) {
      const name = found.full_name || `${found.first_name || ''} ${found.last_name || ''}`.trim() || found.name || '';
      const role = found.position || found.designation || formData.intern_role || '';
      const phone = found.phone || found.mobile || formData.whatsapp_number || '';
      setFormData(prev => ({
        ...prev,
        intern_id: found.id,
        intern_name: name,
        intern_role: role || prev.intern_role,
        whatsapp_number: phone || prev.whatsapp_number,
      }));
    } else {
      setFormData(prev => ({ ...prev, intern_id: '', intern_name: '' }));
    }
  };

  // Handle project dropdown selection
  const handleProjectChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === '__custom__') {
      setCustomProject(true);
      setFormData(prev => ({
        ...prev,
        project_id: '',
        project_name: '',
      }));
      return;
    }

    setCustomProject(false);
    const found = projects.find(p => String(p.id) === String(selectedId));
    if (found) {
      setFormData(prev => ({
        ...prev,
        project_id: found.id,
        project_name: found.name || found.projectName || '',
      }));
    } else {
      setFormData(prev => ({ ...prev, project_id: '', project_name: '' }));
    }
  };

  // Handle mentor dropdown selection
  const handleMentorChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === '__custom__') {
      setCustomMentor(true);
      setFormData(prev => ({
        ...prev,
        mentor_id: '',
        mentor_name: '',
      }));
      return;
    }

    setCustomMentor(false);
    const found = employees.find(emp => String(emp.id) === String(selectedId));
    if (found) {
      const name = `${found.firstName || found.first_name || ''} ${found.lastName || found.last_name || ''}`.trim() || found.name || '';
      setFormData(prev => ({
        ...prev,
        mentor_id: found.id,
        mentor_name: name,
      }));
    } else {
      setFormData(prev => ({ ...prev, mentor_id: '', mentor_name: '' }));
    }
  };

  // Formatted WhatsApp message generator
  const generatedWhatsAppMessage = useMemo(() => {
    const name = formData.intern_name || '[Intern Name]';
    const role = formData.intern_role || '[Role]';
    const project = formData.project_name || '[Project Name]';
    const mentor = formData.mentor_name || 'Team Lead / Admin';
    const start = formData.start_date || todayStr;
    const desc = formData.description ? `\n\n📌 *Scope / Tasks:*\n${formData.description}` : '';
    const extraNotes = formData.whatsapp_notes ? `\n\n💡 *Notes:*\n${formData.whatsapp_notes}` : '';

    return `🚀 *Project Assignment - DZ Infotech*\n━━━━━━━━━━━━━━━━━━━━━━━━\n👤 *Intern:* ${name}\n💼 *Role:* ${role}\n📁 *Project:* ${project}\n👨‍🏫 *Mentor:* ${mentor}\n📅 *Start Date:* ${start}${desc}${extraNotes}\n━━━━━━━━━━━━━━━━━━━━━━━━\nBest of luck! Let's build something awesome.`;
  }, [formData, todayStr]);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(generatedWhatsAppMessage);
    setCopied(true);
    toast.success('WhatsApp assignment message copied!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(generatedWhatsAppMessage);
    const cleanPhone = (formData.whatsapp_number || '').replace(/[^0-9]/g, '');
    let url = `https://wa.me/?text=${encoded}`;
    if (cleanPhone) {
      const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      url = `https://wa.me/${phoneWithCountry}?text=${encoded}`;
    }
    window.open(url, '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.intern_name?.trim()) {
      toast.error('Please enter or select Intern Name');
      return;
    }
    if (!formData.intern_role?.trim()) {
      toast.error('Please enter Intern Role');
      return;
    }
    if (!formData.project_name?.trim()) {
      toast.error('Please enter or select Project Name');
      return;
    }
    if (!formData.start_date) {
      toast.error('Please specify Start Date');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        intern_id: formData.intern_id || null,
        intern_name: formData.intern_name.trim(),
        intern_role: formData.intern_role.trim(),
        project_id: formData.project_id || null,
        project_name: formData.project_name.trim(),
        mentor_id: formData.mentor_id || null,
        mentor_name: formData.mentor_name.trim() || 'Admin',
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        status: formData.status || 'In Progress',
        whatsapp_number: formData.whatsapp_number.trim(),
        description: formData.description.trim(),
        whatsapp_notes: formData.whatsapp_notes.trim(),
      };

      await onSave(payload);
      toast.success(isEdit ? 'Project assignment updated!' : 'Project assigned to intern!');
      onClose();
    } catch (err) {
      console.error('Error saving project assignment:', err);
      toast.error(err.message || 'Failed to save project assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Project Assignment' : 'Assign Project to Intern'}
      maxWidth="780px"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto px-1 py-1">
        {/* Banner */}
        <div className="rounded-xl border border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100/50 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary-600 p-2 text-white shadow-sm">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-primary-950">
                {isEdit ? 'Update Project Assignment' : 'New Project Allocation'}
              </h4>
              <p className="mt-0.5 text-xs text-primary-800">
                Assign projects directly to interns and generate formatted WhatsApp message templates for instant sharing.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Intern Information */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
          <div className="flex items-center justify-between">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <UserIcon className="h-4 w-4 text-primary-600" />
              Intern Details
            </h5>
            <button
              type="button"
              onClick={() => setCustomIntern(!customIntern)}
              className="text-xs font-semibold text-primary-600 hover:text-primary-800 hover:underline"
            >
              {customIntern ? '← Select Existing Intern' : '+ Type Custom Intern Name'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!customIntern ? (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Select Intern <span className="text-danger-600">*</span>
                </label>
                <select
                  value={formData.intern_id || ''}
                  onChange={handleInternChange}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">-- Choose Intern --</option>
                  {interns.map((i) => {
                    const name = i.full_name || `${i.first_name || ''} ${i.last_name || ''}`.trim() || i.name;
                    const role = i.position || i.designation || 'Intern';
                    return (
                      <option key={i.id} value={i.id}>
                        {name} ({role})
                      </option>
                    );
                  })}
                  <option value="__custom__">+ Other / New Intern...</option>
                </select>
              </div>
            ) : (
              <Input
                label="Intern Name *"
                placeholder="e.g. Yash Patel"
                value={formData.intern_name}
                onChange={(e) => setFormData({ ...formData, intern_name: e.target.value })}
                required
              />
            )}

            <div>
              <Input
                label="Intern Role *"
                placeholder="e.g. Frontend Developer"
                value={formData.intern_role}
                onChange={(e) => setFormData({ ...formData, intern_role: e.target.value })}
                required
              />
              {/* Quick suggestion pills */}
              <div className="mt-1.5 flex flex-wrap gap-1">
                {COMMON_RORoles(COMMON_ROLES).slice(0, 4).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData({ ...formData, intern_role: role.replace(' Intern', '') })}
                    className="rounded bg-neutral-200/70 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700 hover:bg-primary-100 hover:text-primary-800 transition"
                  >
                    {role.replace(' Developer', '').replace(' Intern', '')}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="WhatsApp Number (Optional)"
              placeholder="e.g. 9876543210"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
            />

            <Select
              label="Assignment Status"
              options={STATUS_OPTIONS}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
          </div>
        </div>

        {/* Section 2: Project & Mentor Information */}
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
          <div className="flex items-center justify-between">
            <h5 className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
              <BriefcaseIcon className="h-4 w-4 text-primary-600" />
              Project & Mentor
            </h5>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCustomProject(!customProject)}
                className="text-xs font-semibold text-primary-600 hover:text-primary-800 hover:underline"
              >
                {customProject ? '← Select From OS' : '+ Type Custom Project'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!customProject && projects.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Select Project <span className="text-danger-600">*</span>
                </label>
                <select
                  value={formData.project_id || ''}
                  onChange={handleProjectChange}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.projectName}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter Other Project...</option>
                </select>
              </div>
            ) : (
              <Input
                label="Project Name *"
                placeholder="e.g. DZ HRMS Portal"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                required
              />
            )}

            {!customMentor && employees.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-neutral-700">
                    Mentor / Team Lead
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomMentor(true)}
                    className="text-[11px] text-primary-600 hover:underline"
                  >
                    Custom Mentor
                  </button>
                </div>
                <select
                  value={formData.mentor_id || ''}
                  onChange={handleMentorChange}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">-- Choose Mentor --</option>
                  {employees.map((emp) => {
                    const name = `${emp.firstName || emp.first_name || ''} ${emp.lastName || emp.last_name || ''}`.trim() || emp.name;
                    return (
                      <option key={emp.id} value={emp.id}>
                        {name} ({emp.designation || emp.role || 'Staff'})
                      </option>
                    );
                  })}
                  <option value="__custom__">+ Custom Mentor Name...</option>
                </select>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-neutral-700">Mentor Name</label>
                  {employees.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCustomMentor(false)}
                      className="text-[11px] text-primary-600 hover:underline"
                    >
                      ← From Employees
                    </button>
                  )}
                </div>
                <Input
                  placeholder="e.g. Rahul Sharma"
                  value={formData.mentor_name}
                  onChange={(e) => setFormData({ ...formData, mentor_name: e.target.value })}
                />
              </div>
            )}

            <Input
              type="date"
              label="Start Date *"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />

            <Input
              type="date"
              label="Expected End Date (Optional)"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Project Description & Tasks / Scope
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Work on Employee Directory, Attendance Sync, and UI Polish. GitHub repo: ..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {/* Section 3: WhatsApp Share & Preview */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-emerald-600" />
              <span>WhatsApp Assignment Message</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyWhatsApp}
                className="gap-1 border-emerald-300 text-emerald-800 hover:bg-emerald-100/60"
              >
                {copied ? (
                  <>
                    <ClipboardDocumentCheckIcon className="h-4 w-4 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-4 w-4 text-emerald-600" />
                    Copy Text
                  </>
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenWhatsApp}
                className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Open WhatsApp
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-white p-3 font-mono text-xs text-neutral-800 whitespace-pre-line leading-relaxed shadow-inner">
            {generatedWhatsAppMessage}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Save Changes' : 'Assign Project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function COMMON_RORoles(roles) {
  return roles;
}
