import { useState, useEffect, useMemo } from 'react';
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
import { uploadFile } from '../../supabase/storage';
import { createDocument, updateDocument, fetchDocument, fetchCollection, query, where } from '../../supabase/db';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { daysBetween } from '../../utils/dateHelpers';

export default function LeaveForm({ mode = 'create' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [attachment, setAttachment] = useState(null);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState('first_half');
  const [loadingDoc, setLoadingDoc] = useState(mode === 'edit');
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const { items: leaveTypes } = useSupabaseCollection('leaveTypes');

  const employeeQuery = useMemo(() => (base) => query(base, where('uid', '==', user?.uid || '')), [user]);
  const { items: currentEmployees } = useSupabaseCollection('employees', employeeQuery);
  const { items: interns } = useSupabaseCollection('interns');

  const currentEmployee = currentEmployees[0] || interns.find(i => i.uid === user?.uid || i.email === user?.email || i.login_email === user?.email);
  const isIntern = !currentEmployees[0] && !!interns.find(i => i.uid === user?.uid || i.email === user?.email || i.login_email === user?.email);

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetchDocument('leaveRequests', id).then((doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const docData = data.data || data;
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
          const leaveDateVal = docData.leaveDate || docData.fromDate || data.start_date || '';
          reset({
            leaveTypeId: docData.leaveTypeId || data.type_id || '',
            leaveDate: leaveDateVal,
            reason: docData.reason || data.reason || '',
          });
          setIsHalfDay(Boolean(docData.isHalfDay || data.is_half_day || docData.totalDays === 0.5));
          setHalfDayType(docData.halfDayType || data.half_day_type || 'first_half');
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
      // employee_id in DB stores currentEmployee.id (the table PK), not user.uid
      const employeeDbId = currentEmployee?.id;
      let existingLeaves = [];
      if (employeeDbId) {
        existingLeaves = await fetchCollection('leaveRequests', (base) =>
          query(base, where('employeeId', '==', employeeDbId), where('status', 'in', ['approved', 'pending']))
        );
      }

      const leaveDateStr = values.leaveDate;
      const targetDate = new Date(leaveDateStr);
      targetDate.setHours(0, 0, 0, 0);

      const hasOverlap = existingLeaves.some(leave => {
        if (mode === 'edit' && leave.id === id) return false;
        // fetchCollection returns raw Supabase rows; dates may be inside the data JSON column
        const fromDateStr = leave.data?.leaveDate || leave.data?.fromDate || leave.fromDate || leave.from_date || leave.leave_date;
        const toDateStr = leave.data?.toDate || leave.toDate || leave.to_date || fromDateStr;
        if (!fromDateStr) return false;

        const existStart = new Date(fromDateStr);
        existStart.setHours(0, 0, 0, 0);
        const existEnd = new Date(toDateStr);
        existEnd.setHours(0, 0, 0, 0);

        const dateOverlaps = targetDate >= existStart && targetDate <= existEnd;
        if (!dateOverlaps) return false;

        // If existing leave is also on the exact same date and both are half days with different sessions, allow!
        const existIsHalf = Boolean(leave.data?.isHalfDay || leave.is_half_day || leave.data?.totalDays === 0.5);
        const existSession = leave.data?.halfDayType || leave.half_day_type;
        if (existIsHalf && isHalfDay && existStart.getTime() === targetDate.getTime()) {
          return existSession === halfDayType;
        }

        return true;
      });

      if (hasOverlap) {
        toast.error('You already have a pending or approved leave for this date/session. Please choose different date or session.');
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
      const leaveTypeName = typeDoc ? typeDoc.name : (isIntern ? (values.leaveTypeId === 'unpaid-leave' ? 'Unpaid Leave' : 'Intern Leave') : '');
      const totalDays = isHalfDay ? 0.5 : 1;

      // Quota validation
      if (currentEmployee) {
        if (isIntern) {
          // Intern monthly limit check
          if (leaveTypeName !== 'Unpaid Leave') {
            const now = new Date(leaveDateStr);

            let existingLeaves = [];
            if (employeeDbId) {
              existingLeaves = await fetchCollection('leaveRequests', (base) =>
                query(base, where('employeeId', '==', employeeDbId), where('status', 'in', ['approved', 'pending']))
              );
            }

            const currentMonthLeaves = existingLeaves.filter(leave => {
              if (mode === 'edit' && leave.id === id) return false;
              const typeName = leave.data?.leaveTypeName || leave.leaveTypeName;
              if (typeName === 'Unpaid Leave') return false;

              const lDateStr = leave.data?.leaveDate || leave.data?.fromDate || leave.fromDate || leave.from_date;
              if (!lDateStr) return false;
              const lDate = new Date(lDateStr);
              return lDate.getMonth() === now.getMonth() && lDate.getFullYear() === now.getFullYear();
            });

            const used = currentMonthLeaves.reduce((acc, curr) => acc + (curr.totalDays || curr.data?.totalDays || (curr.isHalfDay ? 0.5 : 1)), 0);
            const total = Number(currentEmployee.max_leave_per_month || 0);
            const remaining = total - used;

            if (totalDays > remaining) {
              toast.error(`You have only ${remaining} days remaining this month.`);
              return;
            }
          }
        } else {
          // Employee bucket limit check
          let remaining = null;
          let quotaKey = null;
          if (leaveTypeName === 'Casual Leave') quotaKey = 'casual_leaves';
          else if (leaveTypeName === 'Paid Leave') quotaKey = 'paid_leaves';
          else if (leaveTypeName === 'Medical Leave' || leaveTypeName === 'Sick Leave') quotaKey = 'sick_leaves';

          if (quotaKey) {
            const total = Number(currentEmployee[`${quotaKey}_total`] || 0);
            const used = Number(currentEmployee[`${quotaKey}_used`] || 0);
            remaining = total - used;

            let requestedDays = totalDays;
            let oldDays = 0;
            if (mode === 'edit' && id) {
              const oldDoc = await fetchDocument('leaveRequests', id);
              if (oldDoc.exists()) {
                const oldData = oldDoc.data();
                oldDays = oldData.totalDays || oldData.data?.totalDays || 0;
              }
            }

            if (requestedDays - oldDays > remaining) {
              toast.error(`You have only ${remaining} days remaining for ${leaveTypeName}.`);
              return;
            }

            await updateDocument('employees', currentEmployee.id, {
              data: {
                ...(currentEmployee.data || {}),
                [`${quotaKey}_used`]: used + (requestedDays - oldDays)
              }
            });
          }
        }
      }

      const jsonData = {
        leaveTypeId: values.leaveTypeId || 'intern-leave',
        leaveTypeName,
        leaveDate: leaveDateStr,
        fromDate: leaveDateStr,
        toDate: leaveDateStr,
        totalDays,
        isHalfDay,
        halfDayType: isHalfDay ? halfDayType : null,
        reason: values.reason,
      };

      if (attachmentURL) {
        jsonData.attachmentURL = attachmentURL;
      }

      if (mode === 'edit') {
        const payload = {
          start_date: leaveDateStr,
          end_date: leaveDateStr,
          leave_date: leaveDateStr,
          is_half_day: isHalfDay,
          half_day_type: isHalfDay ? halfDayType : null,
          reason: values.reason,
          data: jsonData
        };
        try {
          await updateDocument('leaveRequests', id, payload);
        } catch (err) {
          await updateDocument('leaveRequests', id, { reason: values.reason, data: jsonData });
        }
        toast.success('Leave request updated');
      } else {
        jsonData.employeeId = user.uid; // Keeping backward compatibility for LeaveList.jsx
        const payload = {
          employee_id: currentEmployee.id, // Using the correct DB primary key to satisfy foreign key
          type_id: values.leaveTypeId || null,
          start_date: leaveDateStr,
          end_date: leaveDateStr,
          leave_date: leaveDateStr,
          is_half_day: isHalfDay,
          half_day_type: isHalfDay ? halfDayType : null,
          status: 'pending',
          reason: values.reason,
          data: jsonData
        };
        try {
          await createDocument('leaveRequests', payload);
        } catch (err) {
          const fallbackPayload = {
            employee_id: currentEmployee.id,
            status: 'pending',
            reason: values.reason,
            data: jsonData
          };
          await createDocument('leaveRequests', fallbackPayload);
        }
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

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
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
          {!isIntern ? (
            <Select label="Leave Type" {...register('leaveTypeId', { required: 'Leave type is required' })} error={errors.leaveTypeId?.message}>
              <option value="">Select leave type</option>
              {leaveTypes.map((type) => {
                let exhausted = false;
                let remaining = null;
                if (currentEmployee) {
                  if (type.name === 'Casual Leave') remaining = (currentEmployee.casual_leaves_total || 0) - (currentEmployee.casual_leaves_used || 0);
                  else if (type.name === 'Paid Leave') remaining = (currentEmployee.paid_leaves_total || 0) - (currentEmployee.paid_leaves_used || 0);
                  else if (type.name === 'Medical Leave' || type.name === 'Sick Leave') remaining = (currentEmployee.sick_leaves_total || 0) - (currentEmployee.sick_leaves_used || 0);

                  if (remaining !== null && remaining <= 0) exhausted = true;
                }

                return (
                  <option key={type.id} value={type.id} disabled={exhausted}>
                    {type.name} {remaining !== null ? `(${remaining} remaining)` : ''}
                  </option>
                );
              })}
            </Select>
          ) : (
            <Select label="Leave Type" {...register('leaveTypeId', { required: 'Leave type is required' })} error={errors.leaveTypeId?.message}>
              <option value="">Select leave type</option>
              <option value="intern-leave">Intern Leave</option>
              <option value="unpaid-leave">Unpaid Leave</option>
            </Select>
          )}
          <Input type="file" label="Attachment (optional)" accept="application/pdf,image/*" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
          {/* Single Leave Date */}
          <Input
            type="date"
            label="Leave Date"
            min={minDateStr}
            {...register('leaveDate', {
              required: 'Leave date is required',
              validate: (value) => {
                if (value < minDateStr) return 'Leave must be for today or a future date';
                return true;
              }
            })}
            error={errors.leaveDate?.message}
          />

          {/* Half Day Option Toggle */}
          <div className="flex flex-col gap-1.5 justify-end">
            <span className="text-sm font-medium text-neutral-700">Half Day Option</span>
            <div className="flex items-center justify-between h-[42px] px-3.5 rounded-xl border border-neutral-200 bg-white shadow-xs">
              <span className="text-sm font-medium text-neutral-700">
                {isHalfDay ? (
                  <span className="text-primary-600 font-semibold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary-600 animate-pulse"></span>
                    Half Day (0.5 Day)
                  </span>
                ) : (
                  <span className="text-neutral-500">Full Day (1.0 Day)</span>
                )}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isHalfDay}
                onClick={() => setIsHalfDay(!isHalfDay)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  isHalfDay ? 'bg-primary-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isHalfDay ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* If Half Day is selected, show session selector */}
          {isHalfDay && (
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              <Select
                label="Half Day Session *"
                value={halfDayType}
                onChange={(e) => setHalfDayType(e.target.value)}
              >
                <option value="first_half">First Half (Morning Session)</option>
                <option value="second_half">Second Half (Afternoon Session)</option>
              </Select>
              <div className="flex items-center text-xs text-neutral-600 p-3 rounded-xl bg-sky-50/70 border border-sky-100">
                <span className="text-sky-800">
                  ℹ️ Applying for a half day will deduct <strong>0.5 day</strong> from your leave balance.
                </span>
              </div>
            </div>
          )}
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
