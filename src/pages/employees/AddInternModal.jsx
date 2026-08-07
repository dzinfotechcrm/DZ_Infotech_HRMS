import { useState, useEffect } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';

export default function AddInternModal({ intern, departments, managers, existingEmails = [], open, onClose, onSave }) {
  const [saving, setSaving] = useState(false);

  const defaultStartDate = formatDate(new Date(), 'yyyy-MM-dd');
  const defaultEndDate = formatDate(new Date(new Date().setMonth(new Date().getMonth() + 2)), 'yyyy-MM-dd');
  const defaultOfferDate = defaultStartDate;
  const defaultAcceptanceDate = formatDate(new Date(new Date().setDate(new Date().getDate() + 2)), 'yyyy-MM-dd');

  const initialFormState = {
    // Identity & Contact
    full_name: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    dob: '',
    photo_url: '',

    // Internship Details
    position: '',
    department_id: '',
    start_date: defaultStartDate,
    end_date: defaultEndDate,
    duration_text: '2 months',
    is_paid: false,
    stipend_amount: '',
    work_mode: 'Remote',
    working_days: 'Monday to Friday',
    working_hours: 'Flexible with minimum 5-6 hours/day',
    max_leave_per_month: '5',

    // Offer Metadata
    offer_date: defaultOfferDate,
    acceptance_deadline: defaultAcceptanceDate,

    // Certificate Block
    certificate_eligible: true,
    skills_technologies: '',

    // NDA
    nda_date: defaultOfferDate,

    // System / Access
    login_email: '',
    status: 'Active',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (open) {
      if (intern) {
        let fn = intern.first_name || '';
        let mn = intern.middle_name || '';
        let ln = intern.last_name || '';
        if (!fn && !ln && intern.full_name) {
          const parts = intern.full_name.split(' ');
          fn = parts[0] || '';
          if (parts.length > 2) {
            mn = parts.slice(1, -1).join(' ');
            ln = parts[parts.length - 1];
          } else if (parts.length === 2) {
            ln = parts[1];
          }
        }
        setFormData({ ...initialFormState, ...intern, first_name: fn, middle_name: mn, last_name: ln });
      } else {
        setFormData(initialFormState);
      }
      setErrors({});
    }
  }, [open, intern]);

  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      try {
        const start = parseISO(formData.start_date);
        const end = parseISO(formData.end_date);
        if (start && end && end >= start) {
          const days = differenceInDays(end, start) + 1; // inclusive
          let months = Math.round(days / 30);

          if (months === 0) {
            months = 1;
          }
          const text = months === 1 ? '1 month' : `${months} months`;
          setFormData(prev => ({ ...prev, duration_text: text }));
        }
      } catch (e) {
        // ignore date parsing errors
      }
    }
  }, [formData.start_date, formData.end_date]);

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    const required = [
      'first_name', 'last_name', 'full_name', 'email', 'dob', 'position', 'start_date', 'end_date',
      'offer_date', 'acceptance_deadline', 'working_hours'
    ];

    required.forEach(k => {
      if (!formData[k] || String(formData[k]).trim() === '') {
        newErrors[k] = 'This field is required';
        isValid = false;
      }
    });

    if (formData.is_paid && (!formData.stipend_amount || formData.stipend_amount <= 0)) {
      newErrors.stipend_amount = 'Stipend amount is required for paid internships';
      isValid = false;
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    const isEditingSelf = intern && intern.email && intern.email.toLowerCase() === formData.email.trim().toLowerCase();
    if (!isEditingSelf && existingEmails.includes(formData.email.trim().toLowerCase())) {
      newErrors.email = 'This email is already in use';
      isValid = false;
    }

    if (formData.phone && formData.phone.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
      isValid = false;
    }

    if (formData.dob) {
      const parsed = new Date(formData.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsed >= today) {
        newErrors.dob = 'Date of birth cannot be today or in the future';
        isValid = false;
      }
    }

    setErrors(newErrors);
    if (!isValid) toast.error('Please fix the errors in the form.');
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const dataToSave = {};
      Object.keys(initialFormState).forEach(key => {
        dataToSave[key] = formData[key];
      });

      if (!dataToSave.is_paid) {
        dataToSave.stipend_amount = null;
      }
      if (!dataToSave.login_email) {
        dataToSave.login_email = dataToSave.email;
      }
      if (dataToSave.department_id === '') {
        dataToSave.department_id = null;
      }

      await onSave(dataToSave);
      toast.success(intern ? 'Intern updated successfully!' : 'Intern added successfully! Documents are generating...');
      if (!intern) setFormData(initialFormState);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to add intern');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} title={intern ? "Edit Intern" : "Add New Intern"} onClose={onClose} size="max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-8 h-[75vh] overflow-y-auto px-2 pb-4">

        {/* SECTION A: Identity & Contact */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Identity & Contact</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 grid gap-4 sm:grid-cols-3">
              <Input label="First Name" error={errors.first_name} value={formData.first_name} onChange={(e) => {
                const val = e.target.value;
                handleChange('first_name', val);
                handleChange('full_name', [val, formData.middle_name, formData.last_name].filter(Boolean).join(' '));
              }} required />
              <Input label="Middle Name" error={errors.middle_name} value={formData.middle_name} onChange={(e) => {
                const val = e.target.value;
                handleChange('middle_name', val);
                handleChange('full_name', [formData.first_name, val, formData.last_name].filter(Boolean).join(' '));
              }} />
              <Input label="Last Name" error={errors.last_name} value={formData.last_name} onChange={(e) => {
                const val = e.target.value;
                handleChange('last_name', val);
                handleChange('full_name', [formData.first_name, formData.middle_name, val].filter(Boolean).join(' '));
              }} required />
            </div>
            <div className="sm:col-span-2">
              <Input 
                label="Full Name (As on legal docs)" 
                error={errors.full_name} 
                value={formData.full_name} 
                readOnly 
                disabled 
                className="bg-slate-50 cursor-not-allowed text-slate-500" 
              />
            </div>
            <Input label="Email" type="email" error={errors.email} value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
            <Input label="Phone" type="tel" error={errors.phone} value={formData.phone} onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 10) {
                handleChange('phone', val);
              }
            }} />
            <Input label="Date of Birth" type="date" error={errors.dob} value={formData.dob} onChange={(e) => handleChange('dob', e.target.value)} required />
          </div>
        </div>

        {/* SECTION B: Internship Details */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Internship Details</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="Position / Role Title" placeholder="e.g. Full Stack Developer Intern" error={errors.position} value={formData.position} onChange={(e) => handleChange('position', e.target.value)} required />
            </div>
            <Input label="Start Date" type="date" error={errors.start_date} value={formData.start_date} onChange={(e) => handleChange('start_date', e.target.value)} required />
            <Input label="End Date" type="date" error={errors.end_date} value={formData.end_date} onChange={(e) => handleChange('end_date', e.target.value)} required />
            <Input label="Duration Text" placeholder="e.g. 2 months" error={errors.duration_text} value={formData.duration_text} onChange={(e) => handleChange('duration_text', e.target.value)} required />
            <Input label="Max Leave per Month" type="number" error={errors.max_leave_per_month} value={formData.max_leave_per_month} onChange={(e) => handleChange('max_leave_per_month', e.target.value)} required />

            <Select label="Work Mode" error={errors.work_mode} value={formData.work_mode} onChange={(e) => {
              const val = e.target.value;
              handleChange('work_mode', val);
              if (val === 'On-site') {
                handleChange('working_hours', 'As Per Company Policy(7 Hours/Day For Intern)');
              } else if (val === 'Not Mentioned') {
                handleChange('working_hours', 'N/A');
              } else {
                handleChange('working_hours', 'Flexible with minimum 5-6 hours/day');
              }
            }}>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
              <option value="Not Mentioned">Not Mentioned</option>
            </Select>
            <Input label="Working Days" error={errors.working_days} value={formData.working_days} onChange={(e) => handleChange('working_days', e.target.value)} required />
            <div className="sm:col-span-2">
              <Input label="Working Hours" error={errors.working_hours} value={formData.working_hours} onChange={(e) => handleChange('working_hours', e.target.value)} required={formData.work_mode !== 'Not Mentioned'} disabled={formData.work_mode === 'Not Mentioned'} className={formData.work_mode === 'Not Mentioned' ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''} />
            </div>

            <Select label="Compensation Type" value={formData.is_paid ? 'paid' : 'unpaid'} onChange={(e) => handleChange('is_paid', e.target.value === 'paid')}>
              <option value="unpaid">Unpaid Internship</option>
              <option value="paid">Paid Internship</option>
            </Select>
            {formData.is_paid && (
              <Input label="Stipend Amount (Monthly)" type="number" error={errors.stipend_amount} value={formData.stipend_amount} onChange={(e) => handleChange('stipend_amount', e.target.value)} required={formData.is_paid} />
            )}
          </div>
        </div>

        {/* SECTION C & E: Offer Metadata & NDA */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Dates & Reporting</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Offer Date" type="date" error={errors.offer_date} value={formData.offer_date} onChange={(e) => {
              handleChange('offer_date', e.target.value);
              handleChange('nda_date', e.target.value); // Sync NDA date by default
            }} required />
            <Input label="NDA Effective Date" type="date" error={errors.nda_date} value={formData.nda_date} onChange={(e) => handleChange('nda_date', e.target.value)} required />
            <Input label="Acceptance Deadline" type="date" error={errors.acceptance_deadline} value={formData.acceptance_deadline} onChange={(e) => handleChange('acceptance_deadline', e.target.value)} required />
          </div>
        </div>

        {/* SECTION D: Certificate Block */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Internship Certificate & Skills</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Certificate Eligible?" value={formData.certificate_eligible ? 'true' : 'false'} onChange={(e) => handleChange('certificate_eligible', e.target.value === 'true')}>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
            <Input label="Key Technologies / Skills" placeholder="e.g. React JS, Node JS" error={errors.skills_technologies} value={formData.skills_technologies} onChange={(e) => handleChange('skills_technologies', e.target.value)} />
          </div>
        </div>

        {/* SECTION F: System / Access */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">System Access</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Login Email / Username" placeholder="Defaults to personal email" error={errors.login_email} value={formData.login_email} onChange={(e) => handleChange('login_email', e.target.value)} />
            <Select label="Status" error={errors.status} value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Terminated">Terminated</option>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-200 pt-4 mt-6">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Generating...' : 'Save & Generate Documents'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
