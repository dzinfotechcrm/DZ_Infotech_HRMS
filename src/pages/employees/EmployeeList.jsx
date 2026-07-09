import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { query, orderBy, where, serverTimestamp } from '../../supabase/db';
import {
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  EyeIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { isAdminLike } from '../../utils/rbac';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SearchableSelect from '../../components/ui/SearchableSelect';
import Modal from '../../components/ui/Modal';
import { formatDate, safeDate, daysBetween } from '../../utils/dateHelpers';
import { removeDocument, upsertDocument, createDocument, updateDocument } from '../../supabase/db';
import toast from 'react-hot-toast';
import { getBankOptions } from '../../data/banks';
import * as XLSX from 'xlsx';

import AddInternModal from './AddInternModal';
import InternDetailModal from './InternDetailModal';
import { generateAndUploadInternDocuments } from '../../utils/internPdfGenerator';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'managers', label: 'Managers' },
  { key: 'employees', label: 'Employees' },
  { key: 'interns', label: 'Interns' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const PAGE_SIZE = 10;

// Utility: Export Excel
function exportData(rows, filename = 'employees') {
  const data = rows.map((row) => ({
    'Employee ID': row.employeeId || '',
    'Name': `${row.firstName || ''} ${row.lastName || ''}`.trim(),
    'Email': row.email || '',
    'Phone': row.phone ? String(row.phone) : '',
    'Department': row.department || '',
    'Designation': row.designation || '',
    'Role': row.role || '',
    'Status': row.status || '',
    'Join Date': formatDate(row.joinDate, 'dd MMM yyyy') || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

  // Auto-adjust column widths
  const max_width = data.reduce((w, r) => {
    Object.keys(r).forEach(key => {
      w[key] = Math.max(w[key] || key.length, String(r[key] || '').length);
    });
    return w;
  }, {});

  worksheet['!cols'] = Object.keys(data[0] || {}).map(key => ({ wch: max_width[key] + 2 }));

  const today = formatDate(new Date(), 'yyyy-MM-dd');
  XLSX.writeFile(workbook, `${filename}-${today}.xlsx`);
}

// Component: Status Badge
function StatusBadge({ status }) {
  const normalized = String(status || 'active').toLowerCase();
  const styles = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-600',
    'on leave': 'bg-amber-100 text-amber-700',
    terminated: 'bg-rose-100 text-rose-700',
    default: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[normalized] || styles.default}`}>
      {status ? String(status).replace(/\b\w/g, (char) => char.toUpperCase()) : 'Active'}
    </span>
  );
}

// Component: Attendance Badge
function AttendanceBadge({ status }) {
  const normalized = status ? String(status).toLowerCase() : 'not marked';
  const options = {
    present: { label: 'Present', classes: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    absent: { label: 'Absent', classes: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
    'not marked': { label: 'Not Marked', classes: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
  };
  const { label, classes, dot } = options[normalized] || options['not marked'];
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

// Component: Sortable Table Header
function SortableHeading({ label, active, sortDirection, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-left font-semibold text-slate-700 transition hover:text-primary-700"
    >
      <span>{label}</span>
      <ChevronUpDownIcon className={`h-4 w-4 text-slate-400 ${active && sortDirection === 'desc' ? 'rotate-180' : ''}`} />
    </button>
  );
}

// Component: View Employee Modal
function ViewEmployeeModal({ employee, attendanceStatus, open, onClose, managers }) {
  if (!employee) return null;

  return (
    <Modal open={open} title="Employee Details" onClose={onClose}>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-100 text-xl font-bold text-primary-700 ring-4 ring-white shadow-sm">
            {employee.photoURL ? (
              <img src={employee.photoURL} alt={employee.firstName} className="h-full w-full object-cover" />
            ) : (
              `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{employee.firstName} {employee.lastName}</h3>
            <p className="text-sm font-medium text-slate-500">{employee.designation || 'Employee'} • {employee.department || 'No Dept'}</p>
          </div>
        </div>

        {/* Personal Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900">Personal Information</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500">First Name</p>
              <p className="mt-1 text-sm text-slate-900">{employee.firstName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Last Name</p>
              <p className="mt-1 text-sm text-slate-900">{employee.lastName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Email</p>
              <p className="mt-1 text-sm text-slate-900">{employee.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Phone</p>
              <p className="mt-1 text-sm text-slate-900">{employee.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Date of Birth</p>
              <p className="mt-1 text-sm text-slate-900">{formatDate(employee.dob) || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Gender</p>
              <p className="mt-1 text-sm text-slate-900">{employee.gender || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Blood Group</p>
              <p className="mt-1 text-sm text-slate-900">{employee.bloodGroup || '—'}</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900">Contact Information</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500">Address Line</p>
              <p className="mt-1 text-sm text-slate-900">{employee.address?.line1 || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">City</p>
              <p className="mt-1 text-sm text-slate-900">{employee.address?.city || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">State</p>
              <p className="mt-1 text-sm text-slate-900">{employee.address?.state || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pincode</p>
              <p className="mt-1 text-sm text-slate-900">{employee.address?.pincode || '—'}</p>
            </div>
          </div>
        </div>

        {/* Job Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900">Job Information</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500">Employee ID</p>
              <p className="mt-1 text-sm text-slate-900">{employee.employeeId || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Department</p>
              <p className="mt-1 text-sm text-slate-900">{employee.department || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Designation</p>
              <p className="mt-1 text-sm text-slate-900">{employee.designation || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Role</p>
              <p className="mt-1 text-sm text-slate-900">{employee.role || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Manager</p>
              <p className="mt-1 text-sm text-slate-900">
                {employee.managerId
                  ? (() => {
                    const m = managers?.find(mgr => mgr.id === employee.managerId);
                    return m ? `${m.firstName} ${m.lastName}` : employee.managerId;
                  })()
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Status</p>
              <div className="mt-1"><StatusBadge status={employee.status} /></div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Join Date</p>
              <p className="mt-1 text-sm text-slate-900">{formatDate(employee.joinDate) || '—'}</p>
            </div>
          </div>
        </div>

        {/* Salary Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900">Compensation & Bank Details</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500">Basic Salary</p>
              <p className="mt-1 text-sm text-slate-900">₹{(employee.basicSalary || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Attendance Today</p>
              <div className="mt-1"><AttendanceBadge status={attendanceStatus} /></div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">HRA</p>
              <p className="mt-1 text-sm text-slate-900">₹{(employee.hra || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">DA</p>
              <p className="mt-1 text-sm text-slate-900">₹{(employee.da || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Travel Allowance</p>
              <p className="mt-1 text-sm text-slate-900">₹{(employee.travelAllowance || 0).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">PF Applicable</p>
              <p className="mt-1 text-sm text-slate-900">{employee.pfApplicable ? 'Yes' : 'No'}</p>
            </div>
            <div className="sm:col-span-2">
              <h5 className="text-xs font-semibold text-slate-700 mt-2 border-t border-slate-100 pt-3">Bank Details</h5>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Bank Name</p>
              <p className="mt-1 text-sm text-slate-900">{employee.bankName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Account Number</p>
              <p className="mt-1 text-sm text-slate-900">{employee.bankAccount || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">IFSC Code</p>
              <p className="mt-1 text-sm text-slate-900">{employee.ifsc || '—'}</p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900">Documents & Emergency Contacts</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-slate-500">Aadhaar Number</p>
              <p className="mt-1 text-sm text-slate-900">{employee.aadhar || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">PAN Number</p>
              <p className="mt-1 text-sm text-slate-900">{employee.pan || '—'}</p>
            </div>
            <div className="sm:col-span-2">
              <h5 className="text-xs font-semibold text-slate-700 mt-2 border-t border-slate-100 pt-3">Emergency Contact 1</h5>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Name</p>
              <p className="mt-1 text-sm text-slate-900">{employee.emergencyContactName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Phone</p>
              <p className="mt-1 text-sm text-slate-900">{employee.emergencyContactPhone || '—'}</p>
            </div>
            <div className="sm:col-span-2">
              <h5 className="text-xs font-semibold text-slate-700 mt-2 border-t border-slate-100 pt-3">Emergency Contact 2</h5>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Name</p>
              <p className="mt-1 text-sm text-slate-900">{employee.emergencyContactName2 || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Phone</p>
              <p className="mt-1 text-sm text-slate-900">{employee.emergencyContactPhone2 || '—'}</p>
            </div>
          </div>
        </div>

      </div>

      <div className="border-t border-slate-200 pt-4 mt-6">
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

// Component: Leave History Modal
function LeaveHistoryModal({ employee, open, onClose }) {
  const leaveQuery = useMemo(() => {
    if (!employee || !open) return (base) => query(base, where('employeeId', '==', 'INVALID'));
    const ids = [employee.uid, employee.id].filter(Boolean);
    return (base) => query(base, where('employeeId', 'in', ids.length > 0 ? ids : ['INVALID']));
  }, [employee, open]);

  const { items: leaves } = useSupabaseCollection('leaveRequests', leaveQuery);

  if (!employee) return null;

  return (
    <Modal open={open} title={`${employee.firstName}'s Leave History`} onClose={onClose} size="max-w-2xl">
      <div className="space-y-6">
        <div>
          {leaves.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="max-h-80 overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Leave Type</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 font-medium">Days</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {leaves.map((leave) => (
                      <tr key={leave.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-900 font-medium">{leave.leaveTypeName || leave.leaveType || leave.leaveTypeId || '—'}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                          {formatDate(leave.fromDate, 'dd MMM')} - {formatDate(leave.toDate, 'dd MMM yyyy')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{leave.totalDays || daysBetween(leave.fromDate, leave.toDate)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            leave.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                            {leave.status ? leave.status.charAt(0).toUpperCase() + leave.status.slice(1) : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No leave requests found for this employee.</p>
          )}
        </div>
      </div>
      <div className="border-t border-slate-200 pt-4 mt-6">
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}

// Component: Edit Employee Modal
function EditEmployeeModal({ employee, departments, managers, existingEmails = [], existingPhones = [], existingEmployeeIds = [], open, onClose, onSave }) {
  const [formData, setFormData] = useState(employee || {});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        address: employee.address || { line1: '', city: '', state: '', pincode: '' },
        casualLeaves: employee.casual_leaves_total ?? '0',
        paidLeaves: employee.paid_leaves_total ?? '0',
        sickLeaves: employee.sick_leaves_total ?? '0',
      });
      setErrors({});
    } else {
      setFormData({ address: { line1: '', city: '', state: '', pincode: '' } });
      setErrors({});
    }
  }, [employee]);

  const handleChange = (field, value) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormData((prev) => {
      const val = field === 'email' ? value.toLowerCase() : value;
      const nextData = { ...prev, [field]: val };
      if (field === 'role' && val === 'manager') {
        nextData.managerId = '';
      }
      if (field === 'basicSalary') {
        const basic = parseFloat(val) || 0;
        nextData.hra = (basic * 0.40).toFixed(2).replace(/\.00$/, '');
        nextData.da = (basic * 0.15).toFixed(2).replace(/\.00$/, '');
      }
      return nextData;
    });
  };

  const handleAddressChange = (field, value) => {
    setErrors((prev) => ({ ...prev, [`address.${field}`]: undefined }));
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const validate = () => {
    const newErrors = {};
    let isValid = true;

    const required = ['firstName', 'lastName', 'email', 'phone', 'dob', 'gender', 'bloodGroup', 'employeeId', 'departmentId', 'designation', 'role', 'joinDate', 'status', 'basicSalary', 'hra', 'da', 'travelAllowance', 'bankAccount', 'ifsc', 'bankName', 'casualLeaves', 'paidLeaves', 'sickLeaves', 'aadhar', 'pan', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactName2', 'emergencyContactPhone2'];
    if (formData.role !== 'manager') required.push('managerId');

    required.forEach(k => {
      if (formData[k] === undefined || formData[k] === null || String(formData[k]).trim() === '') {
        newErrors[k] = 'This field is required';
        isValid = false;
      }
    });

    const addrRequired = ['line1', 'city', 'state', 'pincode'];
    addrRequired.forEach(k => {
      if (!formData.address || !formData.address[k] || String(formData.address[k]).trim() === '') {
        newErrors[`address.${k}`] = 'This field is required';
        isValid = false;
      }
    });

    if (formData.address?.pincode && !/^\d{6}$/.test(formData.address.pincode)) {
      newErrors['address.pincode'] = 'Pincode must be exactly 6 digits';
      isValid = false;
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors['email'] = 'Please enter a valid email address';
      isValid = false;
    }

    const otherEmails = existingEmails.filter(e => e !== (employee?.email || '').toLowerCase());
    if (formData.email && otherEmails.includes(formData.email.trim().toLowerCase())) {
      newErrors['email'] = 'This email is already in use by another employee';
      isValid = false;
    }

    const otherPhones = existingPhones.filter(p => p !== (employee?.phone || ''));
    if (formData.phone && otherPhones.includes(formData.phone.trim())) {
      newErrors['phone'] = 'This phone number is already in use by another employee';
      isValid = false;
    }

    const otherEmployeeIds = existingEmployeeIds.filter(id => id !== employee?.employeeId);
    if (formData.employeeId && otherEmployeeIds.includes(formData.employeeId.trim())) {
      newErrors['employeeId'] = 'This Employee ID is already in use by another employee';
      isValid = false;
    }

    if (formData.dob) {
      const [year, month, day] = formData.dob.split('-');
      const parsedDob = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const eighteenYearsAgo = new Date(today);
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

      if (parsedDob >= today) {
        newErrors['dob'] = 'Date of birth cannot be today or in the future';
        isValid = false;
      } else if (parsedDob > eighteenYearsAgo) {
        newErrors['dob'] = 'Employee must be at least 18 years old';
        isValid = false;
      }
    }

    if (formData.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc)) {
      newErrors['ifsc'] = 'Invalid IFSC format';
      isValid = false;
    }
    if (formData.bankAccount && !/^\d{9,18}$/.test(formData.bankAccount)) {
      newErrors['bankAccount'] = 'Account number must be 9-18 digits';
      isValid = false;
    }
    if (formData.aadhar && !/^\d{12}$/.test(formData.aadhar)) {
      newErrors['aadhar'] = 'Aadhaar must be exactly 12 digits';
      isValid = false;
    }
    if (formData.pan && !/^[A-Z0-9]{10}$/.test(formData.pan)) {
      newErrors['pan'] = 'PAN must be exactly 10 alphanumeric characters';
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) {
      toast.error('Please fix the errors in the form before saving.');
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      toast.success('Employee updated successfully');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update employee');
    } finally {
      setSaving(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal open={open} title="Edit Employee" onClose={onClose} size="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-8 h-[65vh] overflow-y-auto px-2 pb-4">
        {/* Personal Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Personal Information</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="First Name" error={errors.firstName} value={formData.firstName || ''} onChange={(e) => handleChange('firstName', e.target.value)} required />
            <Input label="Last Name" error={errors.lastName} value={formData.lastName || ''} onChange={(e) => handleChange('lastName', e.target.value)} required />
            <Input label="Email" type="email" error={errors.email} value={formData.email || ''} onChange={(e) => handleChange('email', e.target.value)} required />
            <Input label="Phone" type="tel" error={errors.phone} value={formData.phone || ''} onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} pattern="[0-9]{10}" />
            <Input label="Date of Birth" type="date" error={errors.dob} value={formData.dob || ''} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} onChange={(e) => handleChange('dob', e.target.value)} />
            <Select label="Gender" error={errors.gender} value={formData.gender || ''} onChange={(e) => handleChange('gender', e.target.value)}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
            <Select label="Blood Group" error={errors.bloodGroup} value={formData.bloodGroup || ''} onChange={(e) => handleChange('bloodGroup', e.target.value)}>
              <option value="">Select Blood Group</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </Select>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="Address Line 1" error={errors['address.line1']} value={formData.address?.line1 || ''} onChange={(e) => handleAddressChange('line1', e.target.value)} />
            </div>
            <Input label="City" error={errors['address.city']} value={formData.address?.city || ''} onChange={(e) => handleAddressChange('city', e.target.value)} />
            <Input label="State" error={errors['address.state']} value={formData.address?.state || ''} onChange={(e) => handleAddressChange('state', e.target.value)} />
            <Input label="Pincode" error={errors['address.pincode']} value={formData.address?.pincode || ''} onChange={(e) => handleAddressChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} pattern="[0-9]{6}" />
          </div>
        </div>

        {/* Job Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Job Information</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Role" error={errors.role} value={formData.role || 'employee'} onChange={(e) => handleChange('role', e.target.value)}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
            </Select>
            <Input label="Employee ID" error={errors.employeeId} value={formData.employeeId || ''} onChange={(e) => handleChange('employeeId', e.target.value)} required />
            <Select label="Department" error={errors.departmentId} value={formData.departmentId || ''} onChange={(e) => {
              const deptId = e.target.value;
              const dept = departments.find((d) => d.id === deptId);
              const matchedManager = managers.find((m) => m.uid === dept?.managerId || m.id === dept?.managerId);
              setFormData((prev) => ({ ...prev, departmentId: deptId, managerId: prev.role === 'manager' ? '' : (matchedManager ? matchedManager.id : '') }));
            }}>
              <option value="">Select Department</option>
              {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
            </Select>
            <Input label="Designation" error={errors.designation} value={formData.designation || ''} onChange={(e) => handleChange('designation', e.target.value)} />
            <Select label="Manager" error={errors.managerId} value={formData.managerId || ''} onChange={(e) => handleChange('managerId', e.target.value)} disabled={formData.role === 'manager'}>
              {formData.role === 'manager' ? <option value="">Not applicable</option> : <>
                <option value="">Select Manager</option>
                {managers.map((mgr) => <option key={mgr.id} value={mgr.id}>{mgr.firstName} {mgr.lastName}</option>)}
              </>}
            </Select>
            <Input label="Join Date" type="date" error={errors.joinDate} value={formData.joinDate || ''} onChange={(e) => handleChange('joinDate', e.target.value)} />
            <Select label="Status" error={errors.status} value={formData.status || 'active'} onChange={(e) => handleChange('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </div>

        {/* Salary Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Compensation & Bank Details</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Basic Salary" type="number" error={errors.basicSalary} value={formData.basicSalary || ''} onChange={(e) => handleChange('basicSalary', e.target.value)} />
            <Input label="HRA" type="number" error={errors.hra} value={formData.hra || ''} onChange={(e) => handleChange('hra', e.target.value)} />
            <Input label="DA" type="number" error={errors.da} value={formData.da || ''} onChange={(e) => handleChange('da', e.target.value)} />
            <Input label="Travel Allowance" type="number" error={errors.travelAllowance} value={formData.travelAllowance || ''} onChange={(e) => handleChange('travelAllowance', e.target.value)} />
            <Select label="PF Applicable" error={errors.pfApplicable} value={formData.pfApplicable ? 'true' : 'false'} onChange={(e) => handleChange('pfApplicable', e.target.value === 'true')}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </Select>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Bank Name" error={errors.bankName} value={formData.bankName || ''} onChange={(e) => handleChange('bankName', e.target.value)} />
            <Input label="Account Number" error={errors.bankAccount} value={formData.bankAccount || ''} onChange={(e) => handleChange('bankAccount', e.target.value)} />
            <Input label="IFSC Code" error={errors.ifsc} value={formData.ifsc || ''} onChange={(e) => handleChange('ifsc', e.target.value)} />
          </div>
        </div>

        {/* Documents & Emergency Contacts */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Documents & Emergency Contacts</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Aadhaar Number" error={errors.aadhar} value={formData.aadhar || ''} onChange={(e) => handleChange('aadhar', e.target.value.replace(/\D/g, '').slice(0, 12))} maxLength={12} pattern="\d{12}" title="12-digit Aadhaar Number" />
            <Input label="PAN Number" error={errors.pan} value={formData.pan || ''} onChange={(e) => handleChange('pan', e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10))} maxLength={10} pattern="[A-Z0-9]{10}" title="10-character alphanumeric PAN" />
            <div className="sm:col-span-2 mt-2">
              <h5 className="text-xs font-semibold text-slate-700">Emergency Contact 1</h5>
            </div>
            <Input label="Name" error={errors.emergencyContactName} value={formData.emergencyContactName || ''} onChange={(e) => handleChange('emergencyContactName', e.target.value)} />
            <Input label="Phone" error={errors.emergencyContactPhone} value={formData.emergencyContactPhone || ''} onChange={(e) => handleChange('emergencyContactPhone', e.target.value)} />
            <div className="sm:col-span-2 mt-2">
              <h5 className="text-xs font-semibold text-slate-700">Emergency Contact 2</h5>
            </div>
            <Input label="Name" error={errors.emergencyContactName2} value={formData.emergencyContactName2 || ''} onChange={(e) => handleChange('emergencyContactName2', e.target.value)} />
            <Input label="Phone" error={errors.emergencyContactPhone2} value={formData.emergencyContactPhone2 || ''} onChange={(e) => handleChange('emergencyContactPhone2', e.target.value)} />
          </div>
        </div>

        {/* Leaves Info */}
        <div>
          <h4 className="mb-4 text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Leave Balances</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Casual Leaves" type="number" error={errors.casualLeaves} value={formData.casualLeaves ?? ''} onChange={(e) => handleChange('casualLeaves', e.target.value)} />
            <Input label="Paid Leaves" type="number" error={errors.paidLeaves} value={formData.paidLeaves ?? ''} onChange={(e) => handleChange('paidLeaves', e.target.value)} />
            <Input label="Sick Leaves" type="number" error={errors.sickLeaves} value={formData.sickLeaves ?? ''} onChange={(e) => handleChange('sickLeaves', e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-200 pt-4 mt-6">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Component: Add Employee Modal
function AddEmployeeModal({ departments, managers, existingEmails = [], existingPhones = [], existingEmployeeIds = [], open, onClose, onSave }) {
  const [currentTab, setCurrentTab] = useState(0);
  const [saving, setSaving] = useState(false);

  const initialFormState = {
    // Tab 1: Personal
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    profilePhoto: '',
    address: { line1: '', city: '', state: '', pincode: '' },
    // Tab 2: Job
    employeeId: '',
    departmentId: '',
    designation: '',
    role: 'employee',
    managerId: '',
    joinDate: formatDate(new Date(), 'yyyy-MM-dd'),
    status: 'active',
    // Tab 3: Salary
    basicSalary: '',
    hra: '',
    da: '',
    travelAllowance: '',
    pfApplicable: false,
    bankAccount: '',
    ifsc: '',
    bankName: '',
    // Tab 4: Documents
    aadhar: '',
    pan: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactName2: '',
    emergencyContactPhone2: '',
    // Tab 5: Leaves
    casualLeaves: '0',
    paidLeaves: '0',
    sickLeaves: '0',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isIfscLoading, setIsIfscLoading] = useState(false);
  const [branchDetails, setBranchDetails] = useState('');

  const bankOptions = useMemo(() => getBankOptions(), []);

  const TABS = ['Personal Info', 'Job Info', 'Salary Info', 'Documents'];

  const handleChange = (field, value) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormData((prev) => {
      const val = field === 'email' ? value.toLowerCase() : value;
      const nextData = { ...prev, [field]: val };
      if (field === 'role' && val === 'manager') {
        nextData.managerId = '';
      }
      if (field === 'basicSalary') {
        const basic = parseFloat(val) || 0;
        nextData.hra = (basic * 0.40).toFixed(2).replace(/\.00$/, '');
        nextData.da = (basic * 0.15).toFixed(2).replace(/\.00$/, '');
      }
      return nextData;
    });
  };

  const handleAddressChange = (field, value) => {
    setErrors((prev) => ({ ...prev, [`address.${field}`]: undefined }));
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleBankNameChange = (val) => {
    handleChange('bankName', val);
    handleChange('ifsc', '');
    handleChange('bankAccount', '');
    setBranchDetails('');
  };

  const handleIfscChange = async (val) => {
    const formattedVal = val.toUpperCase();
    handleChange('ifsc', formattedVal);
    handleChange('bankAccount', '');
    setBranchDetails('');

    if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formattedVal)) {
      setIsIfscLoading(true);
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${formattedVal}`);
        if (res.ok) {
          const data = await res.json();
          // Ensure it roughly matches the selected bank
          if (formData.bankName && !data.BANK.toLowerCase().includes(formData.bankName.split(' ')[0].toLowerCase())) {
            setErrors(prev => ({ ...prev, ifsc: 'IFSC belongs to a different bank' }));
          } else {
            setBranchDetails(`${data.BRANCH}, ${data.CITY}`);
            setErrors(prev => ({ ...prev, ifsc: undefined }));
          }
        } else {
          setErrors(prev => ({ ...prev, ifsc: 'Invalid IFSC Code' }));
        }
      } catch (err) {
        setErrors(prev => ({ ...prev, ifsc: 'Failed to verify IFSC' }));
      } finally {
        setIsIfscLoading(false);
      }
    } else if (formattedVal.length > 0 && formattedVal.length < 11) {
      setErrors(prev => ({ ...prev, ifsc: 'IFSC must be 11 characters' }));
    } else if (formattedVal.length === 11) {
      setErrors(prev => ({ ...prev, ifsc: 'Invalid IFSC format' }));
    }
  };

  const validateTab = (tabIndex) => {
    const newErrors = {};
    let isValid = true;

    if (tabIndex === 0) {
      const required = ['firstName', 'lastName', 'email', 'phone', 'dob', 'gender', 'bloodGroup'];
      required.forEach(k => {
        if (!formData[k]) { newErrors[k] = 'This field is required'; isValid = false; }
      });
      const addrRequired = ['line1', 'city', 'state', 'pincode'];
      addrRequired.forEach(k => {
        if (!formData.address[k]) { newErrors[`address.${k}`] = 'This field is required'; isValid = false; }
      });
      if (formData.address.pincode && !/^\d{6}$/.test(formData.address.pincode)) {
        newErrors['address.pincode'] = 'Pincode must be exactly 6 digits';
        isValid = false;
      }
      if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors['email'] = 'Please enter a valid email address';
        isValid = false;
      }
      if (formData.email && existingEmails.includes(formData.email.trim().toLowerCase())) {
        newErrors['email'] = 'This email is already in use by another employee';
        isValid = false;
      }
      if (formData.phone && existingPhones.includes(formData.phone.trim())) {
        newErrors['phone'] = 'This phone number is already in use by another employee';
        isValid = false;
      }
      if (formData.dob) {
        const [year, month, day] = formData.dob.split('-');
        const parsedDob = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const eighteenYearsAgo = new Date(today);
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

        if (parsedDob >= today) {
          newErrors['dob'] = 'Date of birth cannot be today or in the future';
          isValid = false;
        } else if (parsedDob > eighteenYearsAgo) {
          newErrors['dob'] = 'Employee must be at least 18 years old';
          isValid = false;
        }
      }
    }
    if (tabIndex === 1) {
      const required = ['employeeId', 'departmentId', 'designation', 'role', 'joinDate', 'status'];
      if (formData.role !== 'manager') required.push('managerId');
      required.forEach(k => {
        if (!formData[k]) { newErrors[k] = 'This field is required'; isValid = false; }
      });
      if (formData.employeeId && existingEmployeeIds.includes(formData.employeeId.trim())) {
        newErrors['employeeId'] = 'This Employee ID is already in use';
        isValid = false;
      }
    }
    if (tabIndex === 2) {
      const required = ['basicSalary', 'hra', 'da', 'travelAllowance', 'bankAccount', 'ifsc', 'bankName', 'casualLeaves', 'paidLeaves', 'sickLeaves'];
      required.forEach(k => {
        if (String(formData[k]).trim() === '') { newErrors[k] = 'This field is required'; isValid = false; }
      });
      if (formData.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc)) {
        newErrors['ifsc'] = 'Invalid IFSC format';
        isValid = false;
      }
      if (formData.bankAccount && !/^\d{9,18}$/.test(formData.bankAccount)) {
        newErrors['bankAccount'] = 'Account number must be 9-18 digits';
        isValid = false;
      }
      if (errors.ifsc && errors.ifsc !== 'IFSC must be 11 characters') {
        newErrors['ifsc'] = errors.ifsc;
        isValid = false;
      }
    }
    if (tabIndex === 3) {
      const required = ['aadhar', 'pan', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactName2', 'emergencyContactPhone2'];
      required.forEach(k => {
        if (!formData[k]) { newErrors[k] = 'This field is required'; isValid = false; }
      });
      if (formData.aadhar && !/^\d{12}$/.test(formData.aadhar)) {
        newErrors['aadhar'] = 'Aadhaar must be exactly 12 digits';
        isValid = false;
      }
      if (formData.pan && !/^[A-Z0-9]{10}$/.test(formData.pan)) {
        newErrors['pan'] = 'PAN must be exactly 10 alphanumeric characters';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNextTab = () => {
    if (validateTab(currentTab)) {
      setCurrentTab(c => c + 1);
    }
  };

  const handleTabClick = (index) => {
    if (index < currentTab) {
      setCurrentTab(index);
      return;
    }
    for (let i = currentTab; i < index; i++) {
      if (!validateTab(i)) return;
    }
    setCurrentTab(index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final check across all tabs before submitting
    for (let i = 0; i < TABS.length; i++) {
      if (!validateTab(i)) {
        setCurrentTab(i);
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(formData);
      toast.success('Employee added successfully');

      // Reset form and close
      setFormData(initialFormState);
      setCurrentTab(0);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to add employee');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (open) {
      setFormData(initialFormState);
      setErrors({});
      setCurrentTab(0);
      setBranchDetails('');
      setIsIfscLoading(false);
    }
  }, [open]);

  return (
    <Modal open={open} title="Add New Employee" onClose={onClose} size="max-w-3xl">
      <div className="mb-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
          {TABS.map((tab, index) => {
            const isActive = index === currentTab;
            const isPast = index < currentTab;
            return (
              <div
                key={tab}
                className="flex flex-col items-center gap-2 cursor-pointer bg-white px-2"
                onClick={() => handleTabClick(index)}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${isActive ? 'bg-primary-600 text-white ring-4 ring-primary-50' : isPast ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {isPast ? '✓' : index + 1}
                </div>
                <span className={`text-xs font-semibold ${isActive ? 'text-primary-700' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>
                  {tab}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 min-h-[320px]">

        {/* TAB 1: Personal Info */}
        {currentTab === 0 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First Name *" error={errors.firstName} value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
              <Input label="Last Name *" error={errors.lastName} value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
              <Input label="Email *" type="email" error={errors.email} value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
              <Input label="Phone *" type="tel" error={errors.phone} value={formData.phone} onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleChange('phone', val);
              }} pattern="[0-9]{10}" title="Please enter exactly 10 digits" />
              <Input label="Date of Birth *" type="date" error={errors.dob} value={formData.dob} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} onChange={(e) => handleChange('dob', e.target.value)} />
              <Select label="Gender *" error={errors.gender} value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
              <Select label="Blood Group *" error={errors.bloodGroup} value={formData.bloodGroup} onChange={(e) => handleChange('bloodGroup', e.target.value)}>
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </Select>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h5 className="text-sm font-semibold text-slate-700 mb-4">Address</h5>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input label="Address Line *" error={errors['address.line1']} value={formData.address.line1} onChange={(e) => handleAddressChange('line1', e.target.value)} />
                </div>
                <Input label="City *" error={errors['address.city']} value={formData.address.city} onChange={(e) => handleAddressChange('city', e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="State *" error={errors['address.state']} value={formData.address.state} onChange={(e) => handleAddressChange('state', e.target.value)} />
                  <Input label="Pincode *" error={errors['address.pincode']} value={formData.address.pincode} onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    handleAddressChange('pincode', val);
                  }} pattern="[0-9]{6}" title="Please enter exactly 6 digits" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Job Info */}
        {currentTab === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Role *" error={errors.role} value={formData.role} onChange={(e) => handleChange('role', e.target.value)}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
              </Select>
              <Input label="Employee ID *" error={errors.employeeId} value={formData.employeeId} onChange={(e) => handleChange('employeeId', e.target.value)} />
              <Select label="Department *" error={errors.departmentId} value={formData.departmentId} onChange={(e) => {
                const deptId = e.target.value;
                const dept = departments.find((d) => d.id === deptId);
                const matchedManager = managers.find((m) => m.uid === dept?.managerId || m.id === dept?.managerId);
                setFormData(prev => ({
                  ...prev,
                  departmentId: deptId,
                  managerId: prev.role === 'manager' ? '' : (matchedManager ? matchedManager.id : '')
                }));
              }}>
                <option value="">Select Department</option>
                {departments.map((dept) => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
              </Select>
              <Input label="Designation *" error={errors.designation} value={formData.designation} onChange={(e) => handleChange('designation', e.target.value)} />
              <Select
                label="Manager *"
                error={errors.managerId}
                value={formData.managerId}
                onChange={(e) => handleChange('managerId', e.target.value)}
                disabled={formData.role === 'manager'}
              >
                {formData.role === 'manager' ? (
                  <option value="">Not applicable for Manager</option>
                ) : (
                  <>
                    <option value="">Select Manager</option>
                    {managers.map((mgr) => <option key={mgr.id} value={mgr.id}>{mgr.firstName} {mgr.lastName}</option>)}
                  </>
                )}
              </Select>
              <Input label="Join Date *" type="date" error={errors.joinDate} value={formData.joinDate} onChange={(e) => handleChange('joinDate', e.target.value)} />
              <Select label="Status *" error={errors.status} value={formData.status} onChange={(e) => handleChange('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>
        )}

        {/* TAB 3: Salary Info */}
        {currentTab === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Basic Salary (₹) *" type="number" error={errors.basicSalary} value={formData.basicSalary} onChange={(e) => handleChange('basicSalary', e.target.value)} />
              <Input label="HRA (₹) *" type="number" error={errors.hra} value={formData.hra} onChange={(e) => handleChange('hra', e.target.value)} />
              <Input label="DA (₹) *" type="number" error={errors.da} value={formData.da} onChange={(e) => handleChange('da', e.target.value)} />
              <Input label="Travel Allowance (₹) *" type="number" error={errors.travelAllowance} value={formData.travelAllowance} onChange={(e) => handleChange('travelAllowance', e.target.value)} />
              <div className="flex items-center gap-3 mt-6 sm:col-span-2">
                <input
                  type="checkbox"
                  id="pfApplicable"
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600 cursor-pointer"
                  checked={formData.pfApplicable}
                  onChange={(e) => handleChange('pfApplicable', e.target.checked)}
                />
                <label htmlFor="pfApplicable" className="text-sm font-medium text-slate-700 cursor-pointer">
                  PF Applicable (Provident Fund deductions apply)
                </label>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-6">
              <h5 className="text-sm font-semibold text-slate-700 mb-4">Bank Details</h5>
              <div className="grid gap-4 sm:grid-cols-2">
                <SearchableSelect
                  label="Bank Name *"
                  error={errors.bankName}
                  options={bankOptions}
                  value={formData.bankName}
                  onChange={(e) => handleBankNameChange(e.target.value)}
                />

                <div className="flex flex-col relative">
                  <Input
                    label="IFSC Code *"
                    error={errors.ifsc}
                    value={formData.ifsc}
                    onChange={(e) => handleIfscChange(e.target.value)}
                    disabled={!formData.bankName}
                    placeholder={formData.bankName ? "e.g. SBIN0001234" : "Select a bank first"}
                    className={!formData.bankName ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''}
                    maxLength={11}
                  />
                  {isIfscLoading && (
                    <div className="absolute right-3 top-9">
                      <svg className="animate-spin h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  {branchDetails && !errors.ifsc && (
                    <span className="text-xs font-medium text-emerald-600 mt-1">{branchDetails}</span>
                  )}
                </div>

                <Input
                  label="Account Number *"
                  error={errors.bankAccount}
                  value={formData.bankAccount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 18);
                    handleChange('bankAccount', val);
                  }}
                  disabled={!branchDetails}
                  placeholder={!branchDetails ? "Select a valid IFSC first" : ""}
                  className={!branchDetails ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''}
                  pattern="[0-9]{9,18}"
                  title="9 to 18 digit account number"
                />
              </div>
            </div>
            <div className="mt-6 border-t border-slate-100 pt-6">
              <h5 className="text-sm font-semibold text-slate-700 mb-4">Leaves Allocation</h5>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Casual Leaves *" type="number" min="0" error={errors.casualLeaves} value={formData.casualLeaves} onChange={(e) => handleChange('casualLeaves', e.target.value)} />
                <Input label="Paid Leaves *" type="number" min="0" error={errors.paidLeaves} value={formData.paidLeaves} onChange={(e) => handleChange('paidLeaves', e.target.value)} />
                <Input label="Sick Leaves *" type="number" min="0" error={errors.sickLeaves} value={formData.sickLeaves} onChange={(e) => handleChange('sickLeaves', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Docs & Security */}
        {currentTab === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Aadhar Number *" error={errors.aadhar} value={formData.aadhar} onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                handleChange('aadhar', val);
              }} placeholder="12-digit number" pattern="[0-9]{12}" title="12-digit Aadhaar Number" />
              <Input label="PAN Number *" error={errors.pan} value={formData.pan} onChange={(e) => {
                const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
                handleChange('pan', val);
              }} placeholder="10-character alphanumeric" pattern="[A-Z0-9]{10}" title="10-character alphanumeric PAN" />

              <div className="sm:col-span-2 border-t border-slate-100 pt-6 mt-2">
                <h5 className="text-sm font-semibold text-slate-700 mb-4">Emergency Contact 1</h5>
              </div>
              <Input label="Contact Name *" error={errors.emergencyContactName} value={formData.emergencyContactName} onChange={(e) => handleChange('emergencyContactName', e.target.value)} />
              <Input label="Contact Phone *" type="tel" error={errors.emergencyContactPhone} value={formData.emergencyContactPhone} onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleChange('emergencyContactPhone', val);
              }} />

              <div className="sm:col-span-2 mt-2">
                <h5 className="text-sm font-semibold text-slate-700 mb-4">Emergency Contact 2</h5>
              </div>
              <Input label="Contact Name *" error={errors.emergencyContactName2} value={formData.emergencyContactName2} onChange={(e) => handleChange('emergencyContactName2', e.target.value)} />
              <Input label="Contact Phone *" type="tel" error={errors.emergencyContactPhone2} value={formData.emergencyContactPhone2} onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleChange('emergencyContactPhone2', val);
              }} />

            </div>
          </div>
        )}



        <div className="flex gap-3 border-t border-slate-200 pt-6 mt-8">
          <Button variant="secondary" className="mr-auto" onClick={onClose} disabled={saving} type="button">
            Cancel
          </Button>

          {currentTab > 0 && (
            <Button variant="secondary" onClick={() => setCurrentTab(c => c - 1)} type="button">
              Previous
            </Button>
          )}

          {currentTab < TABS.length - 1 && (
            <Button onClick={handleNextTab} type="button">
              Next Step
            </Button>
          )}

          {currentTab === TABS.length - 1 && (
            <Button type="submit" disabled={saving}>
              {saving ? 'Adding Employee...' : 'Add Employee'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}

// Main Component
export default function EmployeeList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State
  const [search, setSearch] = useState(searchParams.get('department') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('employees');
  const [attendanceDate, setAttendanceDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  const [sortBy, setSortBy] = useState('firstName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [groupedView, setGroupedView] = useState(true);
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    if (searchParams.toString()) {
      navigate('/employees', { replace: true });
    }
  }, [navigate, searchParams]);

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [leaveHistoryModalOpen, setLeaveHistoryModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [addInternModalOpen, setAddInternModalOpen] = useState(false);
  const [editInternModalOpen, setEditInternModalOpen] = useState(false);
  const [internDetailModalOpen, setInternDetailModalOpen] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);

  // Firestore Data
  const employeesQuery = useMemo(() => {
    if (!user) return undefined;
    return (base) => query(base, orderBy('createdAt', 'desc'));
  }, [user?.uid]);

  const { items: employees, loading: employeesLoading, refetch: refetchEmployees } = useSupabaseCollection('employees', employeesQuery);
  const { items: allDepartments, loading: departmentsLoading } = useSupabaseCollection('departments', useMemo(() => (base) => query(base, orderBy('name')), []));
  const attendanceQuery = useMemo(() => (base) => query(base, where('date', '==', attendanceDate)), [attendanceDate]);
  const { items: attendanceRecords } = useSupabaseCollection('attendance', attendanceQuery);
  const { items: interns, loading: internsLoading, refetch: refetchInterns } = useSupabaseCollection('interns');

  // Enrich employees with department names
  const enrichedEmployees = useMemo(
    () => {
      // Find current logged in employee's record to get their department
      const currentEmployee = employees.find((e) => e.uid === user?.uid || e.email === user?.email);

      let filtered = employees.filter((emp) =>
        emp.designation?.toLowerCase() !== 'admin' &&
        emp.role !== 'admin' &&
        emp.role?.toLowerCase() !== 'agent' &&
        emp.designation?.toLowerCase() !== 'agent' &&
        emp.designation?.toLowerCase() !== 'field agent'
      );

      // If user is not an admin, only show employees from their department
      if (!isAdminLike(user?.role) && currentEmployee?.departmentId) {
        filtered = filtered.filter(emp => emp.departmentId === currentEmployee.departmentId);
      }

      return filtered.map((emp) => {
        let dept = allDepartments.find((d) => d.id === emp.departmentId);
        if (!dept && (emp.designation?.toLowerCase() === 'manager' || emp.role === 'manager')) {
          dept = allDepartments.find((d) => d.managerId === emp.id || d.managerId === emp.uid);
        }
        return {
          ...emp,
          department: dept?.name || emp.department || '—',
        };
      });
    },
    [employees, allDepartments, user]
  );

  // Derive managers from already-loaded employees — avoids compound Firestore index issues
  const managers = useMemo(
    () =>
      employees
        .filter((e) => e.role?.toLowerCase() === 'manager' || e.designation?.toLowerCase() === 'manager')
        .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || '')),
    [employees]
  );

  // Attendance lookup
  const attendanceLookup = useMemo(() => {
    return attendanceRecords.reduce((map, record) => {
      if (record.employeeId) map[record.employeeId] = record.status;
      return map;
    }, {});
  }, [attendanceRecords]);

  // Grouping logic
  const groupedEmployees = useMemo(() => {
    const managers = enrichedEmployees.filter((e) => e.role?.toLowerCase() === 'manager' || e.designation?.toLowerCase() === 'manager');
    const regularEmployees = enrichedEmployees.filter((e) => e.role?.toLowerCase() !== 'manager' && e.designation?.toLowerCase() !== 'manager');

    // Enrich interns with department names
    const enrichedInterns = interns.map((intern) => {
      let dept = allDepartments.find((d) => d.id === intern.department_id);
      return {
        ...intern,
        isIntern: true,
        department: dept?.name || '—',
        // Map fields to match table expected keys
        firstName: intern.first_name,
        lastName: intern.full_name?.split(' ').slice(1).join(' ') || '',
        email: intern.email,
        phone: intern.phone,
        designation: intern.position || 'Intern',
        status: intern.status,
        joinDate: intern.start_date,
        photoURL: intern.photo_url,
      };
    });

    return { managers, employees: regularEmployees, interns: enrichedInterns };
  }, [enrichedEmployees, interns, allDepartments]);

  // Filter employees
  const getFilteredEmployees = useMemo(() => {
    return (empList) => {
      const term = search.trim().toLowerCase();
      return empList.filter((employee) => {
        const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.toLowerCase();
        const matchesText = [employeeName, employee.email, employee.employeeId, employee.department, employee.designation]
          .some((value) => String(value || '').toLowerCase().includes(term));

        const matchesStatus = statusFilter === 'all' || String(employee.status || 'active').toLowerCase() === statusFilter;

        const matchesDepartment = departmentFilter === 'all' || String(employee.departmentId || '') === departmentFilter;

        const tab = activeTab.toLowerCase();
        const matchesTab =
          tab === 'all' ||
          (tab === 'employees' && !employee.isIntern) ||
          (tab === 'interns' && employee.isIntern);

        return matchesText && matchesStatus && matchesDepartment && matchesTab;
      });
    };
  }, [search, statusFilter, departmentFilter, activeTab]);

  // Sort employees
  const getSortedEmployees = (empList) => {
    const sorted = [...empList];
    sorted.sort((a, b) => {
      const getValue = (item) => {
        if (sortBy === 'firstName') return `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase();
        if (sortBy === 'employeeId') return String(item.employeeId || '').toLowerCase();
        if (sortBy === 'department') return String(item.department || '').toLowerCase();
        if (sortBy === 'designation') return String(item.designation || '').toLowerCase();
        if (sortBy === 'status') return String(item.status || '').toLowerCase();
        if (sortBy === 'joinDate') return safeDate(item.joinDate)?.getTime() || 0;
        return '';
      };
      const aValue = getValue(a);
      const bValue = getValue(b);
      if (typeof aValue === 'number' || typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sortDirection === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
    return sorted;
  };

  // Count totals
  const totalManagers = groupedEmployees.managers.length;
  const totalEmployees = groupedEmployees.employees.length;
  const totalInterns = groupedEmployees.interns.length;
  const presentToday = attendanceRecords.filter((r) => r.status?.toLowerCase() === 'present').length;
  const activeCount = enrichedEmployees.filter((e) => e.status?.toLowerCase() === 'active').length;

  const canDeleteEmployee = (employee) => {
    if (employee.designation?.toLowerCase() !== 'manager' && employee.role?.toLowerCase() !== 'manager') return true;

    let dept = allDepartments.find((d) => d.id === employee.departmentId);
    if (!dept) {
      dept = allDepartments.find((d) => d.managerId === employee.id || d.managerId === employee.uid);
    }
    if (!dept) return true;

    const hasEmployees = employees.some(e => e.id !== employee.id && e.departmentId === dept.id);
    return !hasEmployees;
  };

  // Delete employee
  const confirmDelete = (employee) => {
    setSelectedEmployee(employee);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!selectedEmployee) return;
    const employee = selectedEmployee;
    try {
      if (employee.isIntern) {
        await removeDocument('interns', employee.id);
      } else {
        await removeDocument('employees', employee.id);
      }

      // Audit log
      try {
        await createDocument('auditLogs', {
          action: employee.isIntern ? 'Delete Intern' : 'Delete Employee',
          data: {
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            performedBy: user?.uid,
            performedByName: user?.displayName,
            timestamp: new Date().toISOString(),
          }
        });
      } catch (err) {
        console.warn('Failed to create audit log', err);
      }

      toast.success(`${employee.firstName} ${employee.lastName} deleted.`);
      setDeleteModalOpen(false);
      setSelectedEmployee(null);
      if (employee.isIntern) {
        refetchInterns();
      } else {
        refetchEmployees();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || `Unable to delete ${employee.isIntern ? 'intern' : 'employee'}.`);
    }
  };

  // Modal handlers
  const openViewModal = (employee) => {
    setSelectedEmployee(employee);
    setViewModalOpen(true);
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (formData) => {
    try {
      const payloadData = { ...formData };
      delete payloadData.casualLeaves;
      delete payloadData.paidLeaves;
      delete payloadData.sickLeaves;

      const payload = {
        email: formData.email ? formData.email.toLowerCase().trim() : formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        department_id: formData.departmentId,
        status: formData.status,
        data: {
          ...payloadData,
          casual_leaves_total: Number(formData.casualLeaves || 0),
          paid_leaves_total: Number(formData.paidLeaves || 0),
          sick_leaves_total: Number(formData.sickLeaves || 0),
        }
      };

      await upsertDocument('employees', selectedEmployee.id, payload);

      // Auto-assign as department manager if applicable
      const isManager = payload.role?.toLowerCase() === 'manager' || formData.designation?.toLowerCase() === 'manager';

      // Remove this employee as manager from any other departments they might have managed previously
      const oldDepartments = allDepartments.filter(d => d.managerId === selectedEmployee.id);
      for (const oldDept of oldDepartments) {
        if (!isManager || oldDept.id !== formData.departmentId) {
          await updateDocument('departments', oldDept.id, { data: { ...(oldDept.data || {}), managerId: '' } });
        }
      }

      if (isManager && formData.departmentId) {
        const dept = allDepartments.find((d) => d.id === formData.departmentId);
        if (dept) {
          await updateDocument('departments', dept.id, { data: { ...(dept.data || {}), managerId: selectedEmployee.id } });
        }
      }

      // Audit log
      try {
        await createDocument('auditLogs', {
          action: 'Edit Employee',
          data: {
            employeeId: selectedEmployee.id,
            employeeName: `${formData.firstName} ${formData.lastName}`,
            performedBy: user?.uid,
            performedByName: user?.displayName,
            timestamp: new Date().toISOString(),
          }
        });
      } catch (err) {
        console.warn('Failed to create audit log', err);
      }

      setEditModalOpen(false);
      refetchEmployees();
    } catch (error) {
      throw error;
    }
  };

  const handleAddEmployee = async (formData) => {
    try {
      const payloadData = { ...formData };
      delete payloadData.casualLeaves;
      delete payloadData.paidLeaves;
      delete payloadData.sickLeaves;

      const payload = {
        email: formData.email ? formData.email.toLowerCase().trim() : formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        department_id: formData.departmentId,
        status: formData.status,
        data: {
          ...payloadData,
          casual_leaves_total: Number(formData.casualLeaves || 0),
          casual_leaves_used: 0,
          paid_leaves_total: Number(formData.paidLeaves || 0),
          paid_leaves_used: 0,
          sick_leaves_total: Number(formData.sickLeaves || 0),
          sick_leaves_used: 0,
        }
      };

      const docRef = await createDocument('employees', payload);

      // Auto-assign as department manager if applicable
      const isManager = payload.role?.toLowerCase() === 'manager' || formData.designation?.toLowerCase() === 'manager';
      if (isManager && formData.departmentId) {
        const dept = allDepartments.find((d) => d.id === formData.departmentId);
        if (dept) {
          await updateDocument('departments', dept.id, { data: { ...(dept.data || {}), managerId: docRef.id } });
        }
      }

      // Audit log
      try {
        await createDocument('auditLogs', {
          action: 'Add Employee',
          data: {
            employeeId: docRef.id,
            employeeName: `${formData.firstName} ${formData.lastName}`,
            performedBy: user?.uid,
            performedByName: user?.displayName,
            timestamp: new Date().toISOString(),
          }
        });
      } catch (err) {
        console.warn('Failed to create audit log', err);
      }

      setAddModalOpen(false);
      refetchEmployees();
    } catch (error) {
      throw error;
    }
  };

  const handleAddIntern = async (internData) => {
    try {
      const docRef = await createDocument('interns', internData);
      const generatedIntern = { ...internData, id: docRef.id };

      const { offerLetterPath, ndaPath } = await generateAndUploadInternDocuments(generatedIntern);

      await updateDocument('interns', docRef.id, {
        offer_letter_pdf_url: offerLetterPath,
        nda_pdf_url: ndaPath,
        document_status: 'pending_signature',
      });

      refetchInterns();
    } catch (error) {
      throw error;
    }
  };

  const handleEditIntern = async (internData) => {
    try {
      await updateDocument('interns', selectedIntern.id, internData);
      setEditInternModalOpen(false);
      refetchInterns();
    } catch (error) {
      throw error;
    }
  };

  const handleRegenerateInternDocs = async (internId) => {
    const toastId = toast.loading('Regenerating documents...');
    try {
      const intern = interns.find(i => i.id === internId);
      if (!intern) throw new Error("Intern not found");
      const { offerLetterPath, ndaPath } = await generateAndUploadInternDocuments(intern);
      await updateDocument('interns', internId, {
        offer_letter_pdf_url: offerLetterPath,
        nda_pdf_url: ndaPath,
      });
      toast.success('Documents regenerated successfully!', { id: toastId });
      refetchInterns();
      if (selectedIntern && selectedIntern.id === internId) {
        setSelectedIntern(prev => ({ ...prev, offer_letter_pdf_url: offerLetterPath, nda_pdf_url: ndaPath }));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to regenerate documents', { id: toastId });
    }
  };

  const handleClearSignedDoc = async (internId, docType) => {
    try {
      await updateDocument('interns', internId, {
        [docType]: null,
      });
      toast.success('Signed document cleared.');
      refetchInterns();
      if (selectedIntern && selectedIntern.id === internId) {
        setSelectedIntern(prev => ({ ...prev, [docType]: null }));
      }
    } catch (error) {
      toast.error('Failed to clear document');
    }
  };

  // Pagination
  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(key);
    setSortDirection('asc');
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setActiveTab('employees');
    setAttendanceDate(formatDate(new Date(), 'yyyy-MM-dd'));
    setPage(1);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('[data-action-menu]')) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isLoading = employeesLoading || departmentsLoading || internsLoading;

  // Render table section
  const renderTableSection = (title, empList, count) => {
    if (empList.length === 0) return null;

    const filteredEmp = getFilteredEmployees(empList);
    if (filteredEmp.length === 0) return null;

    const sortedEmp = getSortedEmployees(filteredEmp);
    const paginatedEmp = sortedEmp.slice(0, PAGE_SIZE);

    return (
      <div key={title} className="space-y-3">
        <div className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-3 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <Badge variant="neutral">{filteredEmp.length}</Badge>
        </div>

        {viewMode === 'grid' || !isAdminLike(user?.role) ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedEmp.map((employee) => {
              const attendanceStatus = attendanceLookup[employee.uid] || attendanceLookup[employee.id];
              return (
                <Card key={employee.id} className="flex flex-col p-5 hover:shadow-md transition-shadow relative overflow-hidden group border border-slate-200 bg-white rounded-3xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white shadow-sm">
                        {employee.photoURL ? (
                          <img src={employee.photoURL} alt={employee.firstName} className="h-full w-full object-cover" />
                        ) : (
                          `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 leading-tight">{employee.firstName} {employee.lastName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{employee.designation || 'Employee'}</p>
                      </div>
                    </div>
                    {isAdminLike(user?.role) && (
                      <div className="flex items-center gap-1">
                        {!employee.isIntern ? (
                          <>
                            <button type="button" onClick={() => openEditModal(employee)} className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Edit">
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => confirmDelete(employee)} disabled={!canDeleteEmployee(employee)} className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={!canDeleteEmployee(employee) ? "Cannot delete manager while department has employees" : "Delete"}>
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => { setSelectedIntern(employee); setEditInternModalOpen(true); }} className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Edit Intern">
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => confirmDelete(employee)} className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm flex-1">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">{employee.isIntern ? 'Duration / Mode' : 'Department'}</p>
                      <p className="font-medium text-slate-700 mt-0.5">{employee.isIntern ? `${employee.duration_text || '—'} / ${employee.work_mode || '—'}` : (employee.department || '—')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Status</p>
                      <div className="mt-0.5"><StatusBadge status={employee.status} /></div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 font-medium">Email</p>
                      <p className="font-medium text-slate-700 mt-0.5 truncate" title={employee.email}>{employee.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">{employee.isIntern ? 'Start Date' : 'Join Date'}</p>
                      <p className="font-medium text-slate-700 mt-0.5">{formatDate(employee.isIntern ? employee.start_date : employee.joinDate, 'dd MMM yy')}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => employee.isIntern ? (setSelectedIntern(employee), setInternDetailModalOpen(true)) : openViewModal(employee)}
                      className="flex-1 justify-center py-2 text-xs h-auto bg-slate-50 hover:bg-slate-100"
                      title="View Profile"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                    </Button>
                    {isAdminLike(user?.role) && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setLeaveHistoryModalOpen(true);
                        }}
                        className="flex-1 justify-center py-2 text-xs h-auto bg-slate-50 hover:bg-slate-100"
                        title="Leave History"
                      >
                        <CalendarDaysIcon className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {isAdminLike(user?.role) && (
                      <div className="flex items-center" title="Attendance">
                        <AttendanceBadge status={attendanceStatus} />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">Employee</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">Contact</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">{activeTab === 'interns' ? 'Duration / Mode' : 'Department'}</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">{activeTab === 'interns' ? 'Start Date' : 'Join Date'}</th>
                    <th className="px-6 py-4 text-center font-semibold text-slate-900">Attendance</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEmp.map((employee) => {
                    const attendanceStatus = attendanceLookup[employee.uid] || attendanceLookup[employee.id];
                    return (
                      <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white">
                              {employee.photoURL ? (
                                <img src={employee.photoURL} alt={employee.firstName} className="h-full w-full object-cover" />
                              ) : (
                                `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{employee.firstName} {employee.lastName}</p>
                              <p className="text-xs text-slate-500">{employee.designation || 'Employee'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <p className="text-slate-900">{employee.email}</p>
                          <p className="text-xs text-slate-500">{employee.phone || '—'}</p>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                          {employee.isIntern ? (
                            <>
                              <p className="text-slate-900">{employee.duration_text || '—'}</p>
                              <p className="text-xs text-slate-500">{employee.work_mode || '—'}</p>
                            </>
                          ) : (
                            employee.department || '—'
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <StatusBadge status={employee.status} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                          {formatDate(employee.isIntern ? employee.start_date : employee.joinDate, 'dd MMM yyyy')}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center">
                          {isAdminLike(user?.role) ? <AttendanceBadge status={attendanceStatus} /> : '—'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button type="button" onClick={() => employee.isIntern ? (setSelectedIntern(employee), setInternDetailModalOpen(true)) : openViewModal(employee)} className="text-slate-400 hover:text-primary-600 transition" title="View Profile">
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            {isAdminLike(user?.role) && !employee.isIntern && (
                              <button type="button" onClick={() => {
                                setSelectedEmployee(employee);
                                setLeaveHistoryModalOpen(true);
                              }} className="text-slate-400 hover:text-amber-600 transition" title="Leave History">
                                <CalendarDaysIcon className="h-5 w-5" />
                              </button>
                            )}
                            {isAdminLike(user?.role) && (
                              <button type="button" onClick={() => employee.isIntern ? (setSelectedIntern(employee), setEditInternModalOpen(true)) : openEditModal(employee)} className="text-slate-400 hover:text-emerald-600 transition" title="Edit">
                                <PencilSquareIcon className="h-5 w-5" />
                              </button>
                            )}
                            {isAdminLike(user?.role) && (
                              <button type="button" onClick={() => confirmDelete(employee)} disabled={!employee.isIntern && !canDeleteEmployee(employee)} className="text-slate-400 hover:text-rose-600 transition disabled:opacity-50 disabled:cursor-not-allowed" title={!employee.isIntern && !canDeleteEmployee(employee) ? "Cannot delete manager while department has employees" : "Delete"}>
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const hasResults = activeTab === 'interns'
    ? getFilteredEmployees(groupedEmployees.interns).length > 0
    : getFilteredEmployees(groupedEmployees.managers).length > 0 || getFilteredEmployees(groupedEmployees.employees).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-slate-50 shadow-2xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-300/80">Employee Management</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Directory and access control</h1>
            <p className="mt-2 text-sm text-slate-300/80">Search, filter, and manage employee records in real time.</p>
          </div>
          <div className="flex gap-2">
            {isAdminLike(user?.role) && (
              <Button
                variant="secondary"
                onClick={() => exportData(getSortedEmployees(getFilteredEmployees(enrichedEmployees)), 'employees')}
                className="gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Export Excel
              </Button>
            )}
            {isAdminLike(user?.role) && (
              <div className="flex gap-2">
                <Button onClick={() => setAddModalOpen(true)} className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Add Employee
                </Button>
                <Button onClick={() => setAddInternModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-transparent">
                  <PlusIcon className="h-4 w-4" />
                  Add Intern
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 w-full max-w-md mb-6">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
            ${activeTab === 'employees' 
              ? 'bg-white text-indigo-700 shadow shadow-indigo-100/50' 
              : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'}`}
        >
          Employee / Manager
        </button>
        <button
          onClick={() => setActiveTab('interns')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
            ${activeTab === 'interns' 
              ? 'bg-white text-indigo-700 shadow shadow-indigo-100/50' 
              : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'}`}
        >
          Interns
        </button>
      </div>



      {/* Filters */}
      <Card className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Search by name, email, or ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
          <Select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="all">All Departments</option>
            {allDepartments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </Select>
          <Input type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={resetFilters}>Reset</Button>
            {isAdminLike(user?.role) && (
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg p-1.5 transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`rounded-lg p-1.5 transition ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Table View"
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Card className="p-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        </Card>
      ) : enrichedEmployees.length === 0 ? (
        <Card className="p-12 text-center border border-slate-200 border-dashed bg-slate-50/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <UserCircleIcon className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">{activeTab === 'interns' ? 'No Intern Found' : 'No employees found'}</h3>
          <p className="mt-1 text-sm text-slate-500">{activeTab === 'interns' ? 'There are no interns in the system.' : 'There are no employees or managers in the system.'}</p>
          <div className="mt-6">
            {isAdminLike(user?.role) && (
              <Button onClick={() => setAddModalOpen(true)} className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Add Employee
              </Button>
            )}
          </div>
        </Card>
      ) : !hasResults ? (
        <Card className="p-12 text-center border border-slate-200 border-dashed bg-slate-50/50">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <UserCircleIcon className="h-6 w-6 text-slate-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">{activeTab === 'interns' ? 'No Intern Found' : 'No employees found'}</h3>
          <p className="mt-1 text-sm text-slate-500">We couldn't find anything matching your current filters.</p>
          <div className="mt-6">
            <Button variant="secondary" onClick={resetFilters}>
              Clear Filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeTab === 'interns' ? (
            renderTableSection('Interns', groupedEmployees.interns, totalInterns)
          ) : (
            <>
              {renderTableSection('Managers', groupedEmployees.managers, totalManagers)}
              {renderTableSection('Employees', groupedEmployees.employees, totalEmployees)}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <ViewEmployeeModal
        employee={selectedEmployee}
        attendanceStatus={selectedEmployee ? (attendanceLookup[selectedEmployee.uid] || attendanceLookup[selectedEmployee.id]) : null}
        managers={managers}
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedEmployee(null);
        }}
      />
      <LeaveHistoryModal
        open={leaveHistoryModalOpen}
        employee={selectedEmployee}
        onClose={() => setLeaveHistoryModalOpen(false)}
      />
      <EditEmployeeModal
        employee={selectedEmployee}
        departments={allDepartments}
        managers={managers}
        existingEmails={employees.map(e => (e.email || '').toLowerCase()).filter(Boolean)}
        existingPhones={employees.map(e => e.phone).filter(Boolean)}
        existingEmployeeIds={employees.map(e => e.employeeId).filter(Boolean)}
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSave={handleSaveEdit}
      />
      <AddEmployeeModal
        departments={allDepartments}
        managers={managers}
        existingEmails={employees.map(e => (e.email || '').toLowerCase()).filter(Boolean)}
        existingPhones={employees.map(e => e.phone).filter(Boolean)}
        existingEmployeeIds={employees.map(e => e.employeeId).filter(Boolean)}
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddEmployee}
      />
      <Modal
        open={deleteModalOpen}
        title="Delete Employee"
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedEmployee(null);
        }}
        footer={
          <div className="flex gap-3 pt-3">
            <Button variant="secondary" onClick={() => {
              setDeleteModalOpen(false);
              setSelectedEmployee(null);
            }} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={executeDelete} className="flex-1">
              Delete Employee
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to delete <span className="font-semibold text-slate-900">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</span>? This action cannot be undone.
        </p>
      </Modal>

      {/* Intern Modals */}
      <AddInternModal
        departments={allDepartments}
        managers={managers}
        existingEmails={employees.map(e => (e.email || '').toLowerCase()).filter(Boolean).concat(interns.map(i => i.email))}
        open={addInternModalOpen}
        onClose={() => setAddInternModalOpen(false)}
        onSave={handleAddIntern}
      />
      <AddInternModal
        intern={selectedIntern}
        departments={allDepartments}
        managers={managers}
        existingEmails={interns.map(i => (i.email || '').toLowerCase()).filter(Boolean)}
        open={editInternModalOpen}
        onClose={() => {
          setEditInternModalOpen(false);
          setSelectedIntern(null);
        }}
        onSave={handleEditIntern}
      />
      <InternDetailModal
        intern={selectedIntern}
        managers={managers}
        open={internDetailModalOpen}
        onClose={() => {
          setInternDetailModalOpen(false);
          setSelectedIntern(null);
        }}
        onRegenerate={handleRegenerateInternDocs}
        onClearSigned={handleClearSignedDoc}
      />
    </div>
  );
}
