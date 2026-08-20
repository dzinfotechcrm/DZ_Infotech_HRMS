import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { query, orderBy } from '../../supabase/db';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { createDocument, updateDocument, upsertDocument } from '../../supabase/db';
import { useSupabaseCollection, useSupabaseDocument } from '../../hooks/useSupabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const steps = ['Personal', 'Job Info', 'Account'];

export default function EmployeeForm({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const { item: employee, loading } = useSupabaseDocument('employees', id);
  const { items: departments } = useSupabaseCollection('departments', useMemo(() => (base) => query(base, orderBy('name')), []));
  const { items: managers } = useSupabaseCollection('employees', useMemo(() => (base) => query(base, orderBy('firstName')), []));

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: { line1: '', city: '', state: '', pincode: '' },
    gender: '',
    dob: '',
    departmentId: '',
    designation: '',
    joinDate: '',
    basicSalary: '',
    status: 'active',
    managerId: '',
    employeeId: '',
    uid: '',
    role: 'employee',
    photoURL: '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    gender: '',
    dob: '',
    departmentId: '',
    designation: '',
    joinDate: '',
    basicSalary: '',
    status: '',
    managerId: '',
    employeeId: '',
    uid: '',
    role: '',
    photoURL: '',
  });

  useEffect(() => {
    if (employee) {
      const addr = typeof employee.address === 'object' && employee.address !== null
        ? employee.address
        : { line1: employee.address || '', city: '', state: '', pincode: '' };
      setFormData((prev) => ({ ...prev, ...employee, basicSalary: employee.basicSalary || '', address: addr }));
    }
  }, [employee]);

  function handleChange(field, value) {
    // sanitize phone to digits only
    if (field === 'phone') {
      value = String(value || '').replace(/\D/g, '').slice(0, 10);
    }

    if (field === 'email' && typeof value === 'string') {
      value = value.toLowerCase();
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    // Live/blur validation: clear or set specific field error
    setErrors((prev) => ({ ...prev, [field]: '' }));
    const fieldError = validateField(field, value);
    if (fieldError) {
      setErrors((prev) => ({ ...prev, [field]: fieldError }));
    }
  }

  function validateField(field, value) {
    const v = typeof value === 'string' ? value.trim() : value;
    switch (field) {
      case 'firstName':
        if (!v) return 'First name is required';
        return '';
      case 'lastName':
        if (!v) return 'Last name is required';
        return '';
      case 'email':
        if (!v) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Invalid email';
        return '';
      case 'phone':
        if (!v) return 'Phone number is required';
        if (!/^\d{10}$/.test(v)) return 'Phone number must be exactly 10 digits';
        return '';
      case 'address':
        if (!value || typeof value !== 'object') return 'Address is required';
        if (!value.line1?.trim()) return 'Address line 1 is required';
        if (!value.city?.trim()) return 'City is required';
        if (!value.state?.trim()) return 'State is required';
        if (!value.pincode?.trim()) return 'Pincode is required';
        return '';
      case 'gender':
        if (!v) return 'Gender is required';
        return '';
      case 'dob': {
        if (!v) return '';
        const [year, month, day] = v.split('-');
        if (!year || !month || !day) return 'Invalid date format';
        const parsed = new Date(year, month - 1, day);
        if (Number.isNaN(parsed.getTime())) return 'Invalid date';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsed >= today) return 'Date of birth cannot be today or in the future';
        return '';
      }
      case 'departmentId':
        if (!v) return 'Department is required';
        return '';
      case 'designation':
        if (!v) return 'Designation is required';
        return '';
      case 'joinDate':
        if (!v) return 'Join date is required';
        return '';
      case 'basicSalary':
        if (v === '' || v === null || v === undefined) return 'Basic salary is required';
        if (Number(v) < 0) return 'Basic salary must be positive';
        return '';
      case 'employeeId':
        if (!v) return 'Employee ID is required';
        return '';
      case 'uid':
        return '';
      case 'role':
        if (!v) return 'Role is required';
        return '';
      default:
        return '';
    }
  }

  function validateFields(fields) {
    const newErrors = {};
    for (const f of fields) {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    }

    // merge errors but only set for failing fields
    setErrors((prev) => ({ ...prev, ...newErrors }));

    return Object.keys(newErrors).length === 0;
  }

  async function nextStep() {
    const fieldsByStep = [
      ['firstName', 'lastName', 'email', 'phone', 'address', 'gender', 'dob'],
      ['departmentId', 'designation', 'joinDate', 'basicSalary', 'status', 'managerId'],
      ['employeeId', 'uid', 'role'],
    ];

    const fields = fieldsByStep[step] || [];

    // Validate only fields for this step and show errors only for failing ones
    const ok = validateFields(fields);
    if (ok) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  }

  function validateAll() {
    const allFields = Object.keys(formData);
    const newErrors = {};
    for (const f of allFields) {
      const err = validateField(f, formData[f]);
      if (err) newErrors[f] = err;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validateAll()) return;

    const payload = {
      ...formData,
      basicSalary: Number(formData.basicSalary || 0),
      employeeId: formData.employeeId || `${formData.firstName?.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      uid: formData.uid || '',
    };

    try {
      if (mode === 'edit' && id) {
        await updateDocument('employees', id, payload);
        if (payload.uid) {
          try {
            await upsertDocument('users', payload.uid, { role: payload.role });
          } catch (e) {
            console.error('Failed to sync role to users collection:', e);
          }
        }

        const isManager = payload.role?.toLowerCase() === 'manager' || payload.designation?.toLowerCase() === 'manager';
        
        // Remove this employee as manager from any other departments they might have managed previously
        const oldDepartments = departments.filter(d => d.managerId === id);
        for (const oldDept of oldDepartments) {
          if (!isManager || oldDept.id !== payload.departmentId) {
            await updateDocument('departments', oldDept.id, { data: { ...(oldDept.data || {}), managerId: '' } });
          }
        }

        if (isManager && payload.departmentId) {
          const dept = departments.find((d) => d.id === payload.departmentId);
          if (dept) {
            await updateDocument('departments', dept.id, { data: { ...(dept.data || {}), managerId: id } });
          }
        }

        toast.success('Employee updated');
        navigate('/employees');
      } else {
        const docRef = await createDocument('employees', { ...payload, createdBy: user?.uid || '' });
        if (payload.uid) {
          try {
            await upsertDocument('users', payload.uid, { role: payload.role });
          } catch (e) {
            console.error('Failed to sync role to users collection:', e);
          }
        }

        const isManager = payload.role?.toLowerCase() === 'manager' || payload.designation?.toLowerCase() === 'manager';
        if (isManager && payload.departmentId) {
          const dept = departments.find((d) => d.id === payload.departmentId);
          if (dept) {
            await updateDocument('departments', dept.id, { data: { ...(dept.data || {}), managerId: docRef.id } });
          }
        }

        toast.success('Employee created');
        navigate('/employees');
      }
    } catch (error) {
      toast.error(error.message || 'Unable to save employee');
    }
  }

  if (mode === 'edit' && loading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employees"
        title={mode === 'edit' ? 'Edit employee' : 'Add employee'}
        description="Complete employee profile creation and account setup with guided multi-step entry."
      />
      <Card className="p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.35em] text-primary-700">Employees</div>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900">{mode === 'edit' ? 'Edit employee' : 'Add employee'}</h1>
            <p className="mt-2 text-sm text-neutral-500">Multi-step form with validation for personal, job, and account details.</p>
          </div>
          <Link to="/employees"><Button variant="secondary">Back to list</Button></Link>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {steps.map((label, index) => (
            <div key={label} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${step === index ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-500'}`}>
              {index + 1}. {label}
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {step === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="First Name" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} error={errors.firstName} />
              <Input label="Last Name" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} error={errors.lastName} />
              <Input label="Email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} error={errors.email} />
              <Input label="Phone" type="tel" inputMode="numeric" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} error={errors.phone} />
              <div className="md:col-span-2 space-y-4 rounded-xl border border-neutral-200 p-4">
                <div className="font-medium text-neutral-900">Address</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Address Line 1" className="md:col-span-2" value={formData.address.line1} onChange={(e) => handleChange('address', { ...formData.address, line1: e.target.value })} />
                  <Input label="City" value={formData.address.city} onChange={(e) => handleChange('address', { ...formData.address, city: e.target.value })} />
                  <Input label="State" value={formData.address.state} onChange={(e) => handleChange('address', { ...formData.address, state: e.target.value })} />
                  <Input label="Pincode" value={formData.address.pincode} onChange={(e) => handleChange('address', { ...formData.address, pincode: e.target.value })} />
                </div>
                {errors.address && <p className="text-sm text-danger-600">{errors.address}</p>}
              </div>
              <Select label="Gender" value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)} error={errors.gender}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
              <Input label="Date of Birth" type="date" value={formData.dob} onChange={(e) => handleChange('dob', e.target.value)} error={errors.dob} />
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Select label="Department" value={formData.departmentId} onChange={(e) => handleChange('departmentId', e.target.value)} error={errors.departmentId}>
                <option value="">Select</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </Select>
              <Input label="Designation" value={formData.designation} onChange={(e) => handleChange('designation', e.target.value)} error={errors.designation} />
              <Input label="Join Date" type="date" value={formData.joinDate} onChange={(e) => handleChange('joinDate', e.target.value)} error={errors.joinDate} />
              <Input label="Basic Salary" type="number" step="0.01" value={formData.basicSalary} onChange={(e) => handleChange('basicSalary', e.target.value)} error={errors.basicSalary} />
              <Select label="Status" value={formData.status} onChange={(e) => handleChange('status', e.target.value)} error={errors.status}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              <Select label="Manager" value={formData.managerId} onChange={(e) => handleChange('managerId', e.target.value)}>
                <option value="">Select manager</option>
                {(() => {
                  const dept = departments.find(d => d.id === formData.departmentId);
                  if (!dept || !dept.managerId) return null;
                  const manager = managers.find(m => m.id === dept.managerId);
                  return manager ? <option key={manager.id} value={manager.id}>{manager.firstName} {manager.lastName}</option> : null;
                })()}
              </Select>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Employee ID" value={formData.employeeId} onChange={(e) => handleChange('employeeId', e.target.value)} error={errors.employeeId} />
              <Input label="Auth UID" value={formData.uid} onChange={(e) => handleChange('uid', e.target.value)} error={errors.uid} />
              <Select label="Role" value={formData.role} onChange={(e) => handleChange('role', e.target.value)} error={errors.role}>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </Select>
              <Input label="Photo URL" value={formData.photoURL} onChange={(e) => handleChange('photoURL', e.target.value)} />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {step > 0 && <Button type="button" variant="secondary" onClick={() => setStep((current) => current - 1)}>Previous</Button>}
            {step < steps.length - 1 ? (
              <Button type="button" onClick={nextStep}>Next</Button>
            ) : (
              <Button type="submit">Save Employee</Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
