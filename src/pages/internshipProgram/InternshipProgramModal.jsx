import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

const DURATION_OPTIONS = [
  { value: '3 Months (Fast-Track)', label: '3 Months (Fast-Track)' },
  { value: '6 Months (Advanced)', label: '6 Months (Advanced)' },
  { value: '3 Months', label: '3 Months' },
  { value: '6 Months', label: '6 Months' },
];

const WORK_MODE_OPTIONS = [
  { value: 'Remote / Work From Home', label: 'Remote / Work From Home' },
  { value: 'Hybrid (Remote + Office)', label: 'Hybrid (Remote + Office)' },
  { value: 'On-site / Bhavnagar Office', label: 'On-site / Bhavnagar Office' },
];

const STATUS_OPTIONS = [
  { value: 'Offer Issued', label: 'Offer Issued' },
  { value: 'NDA Signed', label: 'NDA Signed' },
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Terminated', label: 'Terminated' },
];

const COMMON_DOMAINS = [
  'Full Stack Web Development (MERN)',
  'Frontend React Developer',
  'Python & AI Engineering',
  'Mobile App Development (Flutter / React Native)',
  'Backend & Cloud Services (Node.js / PostgreSQL)',
  'UI/UX Design & Product Development',
  'Software Quality Assurance & Testing'
];

export default function InternshipProgramModal({ open, onClose, intern, onSave }) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('candidate'); // 'candidate' | 'internship' | 'legal'

  const todayStr = formatDate(new Date(), 'yyyy-MM-dd');
  const defaultDeadline = formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const defaultEndDate = formatDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

  const initialFormState = {
    // 1. Candidate Personal & College Details
    full_name: '',
    guardian_name: '',
    email: '',
    phone: '',
    college_name: '',
    degree_branch: '',
    permanent_address: '',

    // 2. Internship Offer Details
    position_domain: 'Full Stack Web Development (MERN)',
    department: 'Software Engineering',
    duration: '3 Months (Fast-Track)',
    start_date: todayStr,
    end_date: defaultEndDate,
    work_mode: 'Remote / Work From Home',
    mentor_name: 'Technical Lead / Senior Mentor',
    working_days_hours: 'Monday to Friday, 10:00 AM - 6:00 PM',
    stipend: 'Performance-based / Unpaid Industrial Internship',

    // 3. Legal Dates & Signatory
    offer_date: todayStr,
    acceptance_deadline: defaultDeadline,
    nda_effective_date: todayStr,
    signatory_name: 'Authorized Signatory',
    signatory_designation: 'Founder & Director',
    signatory_place: 'Bhavnagar, Gujarat, India',
    status: 'Offer Issued',
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (intern) {
      setFormData({
        full_name: intern.full_name || '',
        guardian_name: intern.guardian_name || '',
        email: intern.email || '',
        phone: intern.phone || '',
        college_name: intern.college_name || '',
        degree_branch: intern.degree_branch || '',
        permanent_address: intern.permanent_address || '',

        position_domain: intern.position_domain || 'Full Stack Web Development (MERN)',
        department: intern.department || 'Software Engineering',
        duration: intern.duration || '3 Months (Fast-Track)',
        start_date: intern.start_date || todayStr,
        end_date: intern.end_date || defaultEndDate,
        work_mode: intern.work_mode || 'Remote / Work From Home',
        mentor_name: intern.mentor_name || 'Technical Lead / Senior Mentor',
        working_days_hours: intern.working_days_hours || 'Monday to Friday, 10:00 AM - 6:00 PM',
        stipend: intern.stipend || 'Performance-based / Unpaid Industrial Internship',

        offer_date: intern.offer_date || todayStr,
        acceptance_deadline: intern.acceptance_deadline || defaultDeadline,
        nda_effective_date: intern.nda_effective_date || intern.start_date || todayStr,
        signatory_name: intern.signatory_name || 'Authorized Signatory',
        signatory_designation: intern.signatory_designation || 'Founder & Director',
        signatory_place: intern.signatory_place || 'Bhavnagar, Gujarat, India',
        status: intern.status || 'Offer Issued',
        notes: intern.notes || '',
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
    setActiveTab('candidate');
  }, [intern, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      // Auto update end date if start date or duration changes
      if (name === 'start_date' || name === 'duration') {
        const start = name === 'start_date' ? new Date(value) : new Date(prev.start_date);
        const dur = name === 'duration' ? value : prev.duration;
        if (!isNaN(start.getTime())) {
          const monthsToAdd = dur.includes('6') ? 6 : 3;
          const end = new Date(start);
          end.setMonth(end.getMonth() + monthsToAdd);
          next.end_date = formatDate(end, 'yyyy-MM-dd');
        }
      }

      if (name === 'offer_date') {
        const off = new Date(value);
        if (!isNaN(off.getTime())) {
          const acc = new Date(off);
          acc.setDate(acc.getDate() + 7);
          next.acceptance_deadline = formatDate(acc, 'yyyy-MM-dd');
          next.nda_effective_date = value;
        }
      }

      return next;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.full_name?.trim()) newErrors.full_name = 'Candidate full name is required';
    if (!formData.email?.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.phone?.trim()) newErrors.phone = 'Phone / WhatsApp is required';
    if (!formData.college_name?.trim()) newErrors.college_name = 'College / University is required';
    if (!formData.degree_branch?.trim()) newErrors.degree_branch = 'Degree / Branch is required';
    if (!formData.permanent_address?.trim()) newErrors.permanent_address = 'Address is required';
    if (!formData.position_domain?.trim()) newErrors.position_domain = 'Position is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields before saving.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
      });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to save intern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={intern ? 'Edit Internship Program Student' : 'Add Intern to Internship Program'}
      maxWidth="850px"
      disableBackdropClick={saving}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab('candidate')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'candidate'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">1</span>
            Candidate & College
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('internship')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'internship'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">2</span>
            Offer & Terms
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('legal')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'legal'
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-bold">3</span>
            NDA & Signatory
          </button>
        </div>

        {/* TAB 1: Candidate Personal & College Info */}
        {activeTab === 'candidate' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Yash Sharma"
                error={errors.full_name}
                required
              />

              <Input
                label="Son / Daughter of (Parent / Guardian) *"
                name="guardian_name"
                value={formData.guardian_name}
                onChange={handleChange}
                placeholder="e.g. Rajeshbhai Sharma"
                helpText="Included in the legal NDA parties clause"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email Address *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. yash@example.com"
                error={errors.email}
                required
              />

              <Input
                label="Phone / WhatsApp Number *"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                error={errors.phone}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="College / University Name *"
                name="college_name"
                value={formData.college_name}
                onChange={handleChange}
                placeholder="e.g. Shantilal Shah Engineering College, Bhavnagar"
                error={errors.college_name}
                required
              />

              <Input
                label="Degree / Branch & Year *"
                name="degree_branch"
                value={formData.degree_branch}
                onChange={handleChange}
                placeholder="e.g. B.E. Computer Engineering, 4th Year"
                error={errors.degree_branch}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                Permanent Residential Address *
              </label>
              <textarea
                name="permanent_address"
                rows={2}
                value={formData.permanent_address}
                onChange={handleChange}
                placeholder="e.g. Plot No. 124, Diamond Park, Kaliyabid, Bhavnagar, Gujarat - 364002"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${
                  errors.permanent_address
                    ? 'border-danger-500 focus:ring-danger-500/20'
                    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500/20'
                }`}
                required
              />
              {errors.permanent_address && (
                <p className="mt-1 text-xs text-danger-600">{errors.permanent_address}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="button" onClick={() => setActiveTab('internship')}>
                Next: Offer & Terms →
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: Offer Details & Terms */}
        {activeTab === 'internship' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
                  Internship Position / Domain *
                </label>
                <input
                  list="domains-list"
                  name="position_domain"
                  value={formData.position_domain}
                  onChange={handleChange}
                  placeholder="Select or type domain"
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
                <datalist id="domains-list">
                  {COMMON_DOMAINS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
                {errors.position_domain && (
                  <p className="mt-1 text-xs text-danger-600">{errors.position_domain}</p>
                )}
              </div>

              <Input
                label="Department / Team"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Software Engineering"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Internship Duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                options={DURATION_OPTIONS}
              />

              <Input
                label="Start Date *"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />

              <Input
                label="End Date *"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Work Mode / Location"
                name="work_mode"
                value={formData.work_mode}
                onChange={handleChange}
                options={WORK_MODE_OPTIONS}
              />

              <Input
                label="Reporting Mentor / Supervisor"
                name="mentor_name"
                value={formData.mentor_name}
                onChange={handleChange}
                placeholder="e.g. Lead Developer / Mentor"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Working Days & Timings"
                name="working_days_hours"
                value={formData.working_days_hours}
                onChange={handleChange}
                placeholder="e.g. Monday to Friday, 10:00 AM - 6:00 PM"
              />

              <Input
                label="Stipend / Compensation"
                name="stipend"
                value={formData.stipend}
                onChange={handleChange}
                placeholder="e.g. Performance-based / Unpaid"
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveTab('candidate')}>
                ← Back
              </Button>
              <Button type="button" onClick={() => setActiveTab('legal')}>
                Next: NDA & Signatory →
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: NDA & Signatory Settings */}
        {activeTab === 'legal' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Offer Date"
                name="offer_date"
                type="date"
                value={formData.offer_date}
                onChange={handleChange}
              />

              <Input
                label="Acceptance Deadline"
                name="acceptance_deadline"
                type="date"
                value={formData.acceptance_deadline}
                onChange={handleChange}
                helpText="Sign and return on or before"
              />

              <Input
                label="NDA Effective Date"
                name="nda_effective_date"
                type="date"
                value={formData.nda_effective_date}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Authorized Signatory Name"
                name="signatory_name"
                value={formData.signatory_name}
                onChange={handleChange}
                placeholder="Authorized Signatory"
              />

              <Input
                label="Signatory Designation"
                name="signatory_designation"
                value={formData.signatory_designation}
                onChange={handleChange}
                placeholder="Founder & Director"
              />

              <Input
                label="Signatory Place"
                name="signatory_place"
                value={formData.signatory_place}
                onChange={handleChange}
                placeholder="Bhavnagar, Gujarat, India"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Intern Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={STATUS_OPTIONS}
              />

              <Input
                label="Internal Program Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g. Batch 2026, Referred by Prof. Patel"
              />
            </div>

            <div className="rounded-xl border border-primary-100 bg-primary-50/50 p-3.5 text-xs text-primary-900 flex items-start gap-3">
              <span className="text-base">📄</span>
              <div>
                <p className="font-semibold">Automatic Document Generation Ready</p>
                <p className="text-primary-700 mt-0.5">
                  Saving this form will dynamically prepare the <strong>Internship Offer Letter</strong> and <strong>Student Internship NDA</strong> according to the exact DZ Infotech template. Both PDFs will be ready for instant preview and download.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveTab('internship')}>
                ← Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  {intern ? 'Update Intern' : 'Create & Generate PDFs'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
