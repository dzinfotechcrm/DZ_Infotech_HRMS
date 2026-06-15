import { useState, useMemo, useEffect } from 'react';
import { query, where } from '../../supabase/db';
import { serverTimestamp } from '../../supabase/db';
import toast from 'react-hot-toast';
import { PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { upsertDocument, updateDocument } from '../../supabase/db';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { formatDate } from '../../utils/dateHelpers';

export default function AttendanceControl({ user }) {
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [workNotes, setWorkNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const todayStr = formatDate(new Date(), 'yyyy-MM-dd');

  const q = useMemo(() => {
    if (!user?.uid) return undefined;
    return (base) => query(base, where('employeeId', '==', user.uid), where('date', '==', todayStr));
  }, [user?.uid, todayStr]);

  const leaveQuery = useMemo(() => {
    if (!user?.uid) return undefined;
    return (base) => query(base, where('employeeId', '==', user.uid), where('status', '==', 'approved'));
  }, [user?.uid]);

  const { items: attendanceRecords, refetch: refetchAttendance } = useSupabaseCollection('attendance', q);
  const { items: approvedLeaves } = useSupabaseCollection('leaveRequests', leaveQuery);
  const todayRecord = attendanceRecords[0];

  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  const isOnLeaveToday = useMemo(() => {
    return approvedLeaves.some(leave => todayStr >= leave.fromDate && todayStr <= leave.toDate);
  }, [approvedLeaves, todayStr]);

  const handleCheckIn = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docId = `${user.uid}_${todayStr}`;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

      await upsertDocument('attendance', docId, {
        date: todayStr,
        employee_id: user.uid,
        status: 'present',
        check_in: now.toISOString(),
        data: {
          month: todayStr.substring(0, 7),
          year: todayStr.substring(0, 4),
          employeeId: user.uid,
          employeeName: user.displayName || user.email,
          checkIn: timeStr,
          checkOut: '',
          notes: '',
          markedBy: user.uid,
          markedByName: user.displayName,
          timestamp: serverTimestamp(),
        }
      });

      toast.success('Checked in successfully!');
      setCheckInModalOpen(false);
      refetchAttendance();
    } catch (error) {
      console.error(error);
      toast.error('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!user || !todayRecord) return;
    if (!workNotes.trim()) {
      toast.error('Please describe what you did today.');
      return;
    }
    setLoading(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

      await updateDocument('attendance', todayRecord.id, {
        check_out: now.toISOString(),
        data: {
          ...(todayRecord.data || {}),
          checkOut: timeStr,
          notes: workNotes.trim(),
          timestamp: serverTimestamp(),
        }
      });

      toast.success('Checked out successfully!');
      setCheckOutModalOpen(false);
      refetchAttendance();
    } catch (error) {
      toast.error('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Card className="p-5 mb-6 border border-primary-100 bg-primary-50/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Attendance Control</h2>
            <p className="text-sm text-slate-500">Record your working hours for {formatDate(new Date(), 'dd MMM yyyy')}</p>
          </div>
          <div className="flex gap-3 items-center">
            {isOnLeaveToday && (
              <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                On Approved Leave
              </span>
            )}
            {!hasCheckedIn ? (
              <Button disabled={isOnLeaveToday} onClick={() => setCheckInModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                <PlayIcon className="h-5 w-5" />
                Check In
              </Button>
            ) : !hasCheckedOut ? (
              <>
                <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-xl font-semibold flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Checked In at {todayRecord.checkIn}
                </div>
                <Button disabled={isOnLeaveToday} onClick={() => setCheckOutModalOpen(true)} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                  <StopIcon className="h-5 w-5" />
                  Check Out
                </Button>
              </>
            ) : (
              <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm">
                Checked out at {todayRecord.checkOut}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal open={checkInModalOpen} onClose={() => setCheckInModalOpen(false)} title="Confirm Check In">
        <p className="text-slate-600 text-sm">Are you sure you want to check in for today?</p>
        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setCheckInModalOpen(false)} className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCheckIn} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
            {loading ? 'Processing...' : 'Confirm Check In'}
          </Button>
        </div>
      </Modal>

      <Modal open={checkOutModalOpen} onClose={() => setCheckOutModalOpen(false)} title="Check Out">
        <p className="text-slate-600 text-sm mb-4">Please provide a brief summary of what you accomplished today.</p>
        <textarea
          className="w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3"
          rows="4"
          placeholder="E.g., completed task X, fixed bug Y..."
          value={workNotes}
          onChange={(e) => setWorkNotes(e.target.value)}
        />
        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setCheckOutModalOpen(false)} className="flex-1" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCheckOut} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white" disabled={loading}>
            {loading ? 'Processing...' : 'Submit & Check Out'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
