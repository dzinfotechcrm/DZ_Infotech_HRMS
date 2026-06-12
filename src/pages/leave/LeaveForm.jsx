import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';
import { uploadFile } from '../../firebase/storage';
import { createDocument, updateDocument, fetchDocument, fetchCollection, query, where } from '../../firebase/firestore';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { daysBetween } from '../../utils/dateHelpers';

export default function LeaveForm({ mode = 'create' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [attachment, setAttachment] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(mode === 'edit');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const { items: leaveTypes } = useFirestoreCollection('leaveTypes');

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchDocument('leaveRequests', id).then((doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.employeeId !== user?.uid && user?.role !== 'admin' && user?.role !== 'hr') {
            toast.error('Unauthorized');
            navigate('/leave');
            return;
          }
          if (data.status !== 'pending') {
            toast.error('Only pending requests can be edited');
            navigate('/leave');
            return;
          }
          reset({
            leaveTypeId: data.leaveTypeId,
            fromDate: data.fromDate,
            toDate: data.toDate,
            reason: data.reason,
          });
        } else {
          toast.error('Leave request not found');
          navigate('/leave');
        }
      }).catch((err) => {
        toast.error('Failed to load leave request');
      }).finally(() => {
        setLoadingDoc(false);
      });
    }
  }, [mode, id, navigate, reset, user]);

  async function onSubmit(values) {
    try {
      // Check for overlapping approved or pending leaves
      const existingLeaves = await fetchCollection('leaveRequests', (base) => 
        query(base, where('employeeId', '==', user.uid), where('status', 'in', ['approved', 'pending']))
      );

      const newStart = new Date(values.fromDate);
      newStart.setHours(0, 0, 0, 0);
      const newEnd = new Date(values.toDate);
      newEnd.setHours(0, 0, 0, 0);

      const hasOverlap = existingLeaves.some(leave => {
        if (mode === 'edit' && leave.id === id) return false;
        const existStart = new Date(leave.fromDate);
        existStart.setHours(0, 0, 0, 0);
        const existEnd = new Date(leave.toDate);
        existEnd.setHours(0, 0, 0, 0);
        return newStart <= existEnd && newEnd >= existStart;
      });

      if (hasOverlap) {
        toast.error('You already have a pending or approved leave during these dates');
        return;
      }

      let attachmentURL = '';
      if (attachment) {
        if (attachment.size > 5 * 1024 * 1024) {
          toast.error('Attachment must be 5MB or smaller');
          return;
        }
        attachmentURL = await uploadFile(`leaveRequests/${user.uid}/${Date.now()}-${attachment.name}`, attachment, { contentType: attachment.type });
      }
      
      const typeDoc = leaveTypes.find(t => t.id === values.leaveTypeId);
      const leaveTypeName = typeDoc ? typeDoc.name : '';
      const totalDays = daysBetween(values.fromDate, values.toDate);

      const payload = {
        leaveTypeId: values.leaveTypeId,
        leaveTypeName,
        fromDate: values.fromDate,
        toDate: values.toDate,
        totalDays,
        reason: values.reason,
      };

      if (attachmentURL) {
        payload.attachmentURL = attachmentURL;
      }

      if (mode === 'edit') {
        await updateDocument('leaveRequests', id, payload);
        toast.success('Leave request updated');
      } else {
        await createDocument('leaveRequests', {
          ...payload,
          employeeId: user.uid,
          status: 'pending',
        });
        toast.success('Leave request submitted');
      }
      navigate('/leave');
    } catch (error) {
      toast.error(error?.message || `Unable to ${mode === 'edit' ? 'update' : 'submit'} leave request`);
    }
  }

  if (loadingDoc) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  const minDateStr = `${yyyy}-${mm}-${dd}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Leave"
        title={mode === 'edit' ? 'Edit leave application' : 'Apply for leave'}
        description={mode === 'edit' ? 'Update your pending leave request details.' : 'Submit leave requests with attachments and a clear approval workflow.'}
      />
      <Card className="p-6">
        <div className="mb-6">
          <div className="section-title">{mode === 'edit' ? 'Edit Leave' : 'Apply Leave'}</div>
          <p className="muted-text">Submit leave with attachment support and balance-aware approval flow.</p>
        </div>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
        <Select label="Leave Type" {...register('leaveTypeId', { required: 'Leave type is required' })} error={errors.leaveTypeId?.message}>
          <option value="">Select leave type</option>
          {leaveTypes.filter(type => type.name !== 'Annual Leave').map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
        </Select>
        <Input type="file" label="Attachment (optional)" accept="application/pdf,image/*" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
        <Input 
          type="date" 
          label="From Date" 
          min={minDateStr}
          {...register('fromDate', { 
            required: 'From date is required',
            validate: (value) => {
              if (value < minDateStr) return 'Leave must be for a future date';
              return true;
            }
          })} 
          error={errors.fromDate?.message} 
        />
        <Input 
          type="date" 
          label="To Date" 
          min={minDateStr}
          {...register('toDate', { 
            required: 'To date is required',
            validate: (value, formValues) => {
              if (!formValues.fromDate) return true;
              if (value < minDateStr) return 'Leave must be for a future date';
              const from = new Date(formValues.fromDate);
              const to = new Date(value);
              // reset time for accurate day comparison
              from.setHours(0,0,0,0);
              to.setHours(0,0,0,0);
              if (to < from) {
                return 'To Date cannot be earlier than From Date';
              }
              return true;
            }
          })} 
          error={errors.toDate?.message} 
        />
        <Input className="md:col-span-2" label="Reason" {...register('reason', { required: 'Reason is required' })} error={errors.reason?.message} />
        <div className="md:col-span-2 flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/leave')}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner className="h-4 w-4 border-white" />}
            {mode === 'edit' ? 'Update Leave' : 'Submit Leave'}
          </Button>
        </div>
      </form>
    </Card>
    </div>
  );
}
