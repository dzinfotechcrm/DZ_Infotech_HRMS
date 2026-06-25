import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { query, where } from '../../supabase/db';
import { isAdminLike } from '../../utils/rbac';
import { updateDocument } from '../../supabase/db';
import { uploadFile } from '../../supabase/storage';

export default function Profile() {
  const { user } = useAuth();
  const employeeQuery = useMemo(() => (base) => query(base, where('uid', '==', user?.uid)), [user?.uid]);
  const { items: employees } = useSupabaseCollection('employees', employeeQuery);
  const employee = employees[0];
  const editableAll = isAdminLike(user?.role);
  const [preview, setPreview] = useState('');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (employee) {
      reset(employee);
    }
  }, [employee, reset]);

  async function onSubmit(values) {
    try {
      let photoURL = employee?.photoURL || '';
      if (preview) {
        photoURL = await uploadFile(`profile-photos/${user.uid}/${Date.now()}.png`, await (await fetch(preview)).blob(), { contentType: 'image/png' });
      }

      // Do not spread `...employee` here because it contains flattened fields
      // (like 'aadhar') which are not valid top-level columns in Supabase.
      // phone and photoURL are also NOT top-level columns, so they must 
      // ONLY go inside the `data` JSONB column.
      const payload = {
        data: {
          ...(employee.data || {}),
          phone: values.phone,
          photoURL: photoURL
        }
      };

      await updateDocument('employees', employee.id, payload);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error?.message || 'Unable to update profile');
    }
  }

  if (!employee) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="My Personal Profile"
        description="Update your profile details and manage your employee record from one place."
      />
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-primary-100 text-2xl font-bold text-primary-700">
            {employee.photoURL ? <img src={employee.photoURL} alt={employee.firstName} className="h-full w-full object-cover" /> : `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`}
          </div>
          <div>
            <h1 className="page-title">{employee.firstName} {employee.lastName}</h1>
            <div className="mt-2 flex gap-2"><Badge tone="primary">{employee.role}</Badge><Badge tone="accent">{employee.department || 'No department'}</Badge></div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Phone" type="tel" maxLength={10} {...register('phone', { pattern: { value: /^[0-9]{10}$/, message: 'Phone must be exactly 10 digits' } })} error={errors.phone?.message} disabled={!editableAll && user?.role === 'employee'} />
          <Input
            label="Address"
            value={employee?.address ? (typeof employee.address === 'string' ? employee.address : [employee.address.line1, employee.address.city, employee.address.state, employee.address.pincode].filter(Boolean).join(', ')) : ''}
            readOnly
            disabled
            className="bg-neutral-50"
          />

          <Input label="Upload Photo (preview only)" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setPreview(URL.createObjectURL(file)); } }} />
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Profile'}</Button>
            {preview && <div className="flex items-center gap-2 text-sm text-neutral-500">Upload preview: <img src={preview} alt="Preview" className="h-12 w-12 rounded-xl object-cover" /></div>}
          </div>
        </form>
      </Card>
    </div>
  );
}
