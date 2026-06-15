import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { query, where, orderBy } from '../../supabase/db';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { isAdminLike } from '../../utils/rbac';
import { uploadFile } from '../../supabase/storage';
import { createDocument } from '../../supabase/db';
import { useSupabaseCollection } from '../../hooks/useSupabase';

const docTypes = ['Offer Letter', 'ID Proof', 'Address Proof', 'Certificates', 'Other'];

export default function DocumentUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  
  const employeesQuery = useMemo(() => (base) => query(base, where('status', '==', 'active'), orderBy('firstName')), []);
  const { items: employees } = useSupabaseCollection('employees', employeesQuery);

  async function onSubmit(values) {
    try {
      if (!file) {
        toast.error('Select a file to upload');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File must be 5MB or smaller');
        return;
      }
      const employeeId = isAdminLike(user?.role) ? values.employeeId : user.uid;
      if (!employeeId) {
        toast.error('Selected employee has no UID');
        return;
      }
      const storagePath = `documents/${employeeId}/${values.docType}/${Date.now()}-${file.name}`;
      const fileURL = await uploadFile(storagePath, file, { contentType: file.type });
      await createDocument('documents', {
        employeeId,
        docType: values.docType,
        fileName: file.name,
        fileURL,
        storagePath,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: user.uid,
      });
      toast.success('Document uploaded');
      navigate('/documents');
    } catch (error) {
      toast.error(error?.message || 'Unable to upload document');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Documents"
        title="Upload employee documents"
        description="Keep employee documentation centralized and secure with easy upload workflows."
      />
      <Card className="p-6">
        <div className="mb-6">
          <div className="section-title">Upload Document</div>
          <p className="muted-text">PDF and image uploads are stored in Cloudinary with per-employee folders.</p>
        </div>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        {isAdminLike(user?.role) ? (
          <Select label="Employee" {...register('employeeId', { required: 'Employee is required' })} error={errors.employeeId?.message}>
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.uid || ''}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
            ))}
          </Select>
        ) : (
          <div className="md:col-span-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">Uploading as {user.displayName || user.email}</div>
        )}
        <Select label="Document Type" {...register('docType', { required: 'Document type is required' })} error={errors.docType?.message}>
          <option value="">Select type</option>
          {docTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </Select>
        <Input label="File" type="file" accept="application/pdf,image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        <div className="md:col-span-2 flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/documents')}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Spinner className="h-4 w-4 border-white" />}Upload</Button>
        </div>
      </form>
    </Card>
  );
}
