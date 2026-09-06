import { useState, useMemo } from 'react';
import { query, where } from '../../supabase/db';
import { updateDocument, serverTimestamp } from '../../supabase/db';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import toast from 'react-hot-toast';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import { formatDate } from '../../utils/dateHelpers';

export default function MissingCheckoutWarning({ user }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [checkoutTime, setCheckoutTime] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const todayStr = formatDate(new Date(), 'yyyy-MM-dd');
  
  const q = useMemo(() => {
    if (!user?.uid) return undefined;
    return (base) => query(base, where('employeeId', '==', user.uid));
  }, [user?.uid]);

  const { items: attendanceRecords, refetch: refetchAttendance } = useSupabaseCollection('attendance', q);

  const missingCheckoutRecords = useMemo(() => {
    return attendanceRecords.filter(record => 
      record.date < todayStr && 
      record.check_in && 
      !record.check_out &&
      record.status === 'present'
    ).sort((a, b) => a.date.localeCompare(b.date));
  }, [attendanceRecords, todayStr]);

  const handleResolveClick = (record) => {
    setSelectedRecord(record);
    setCheckoutTime('');
    setWorkNotes('');
  };

  const handleCloseModal = () => {
    setSelectedRecord(null);
  };

  const handleSubmitCheckout = async () => {
    if (!selectedRecord) return;
    if (!checkoutTime) {
      toast.error('Please select a checkout time.');
      return;
    }
    if (!workNotes.trim()) {
      toast.error('Please describe what you did on this day.');
      return;
    }

    // Combine date and time
    const checkoutDate = new Date(`${selectedRecord.date}T${checkoutTime}`);
    const checkInDate = new Date(selectedRecord.check_in);

    if (checkoutDate <= checkInDate) {
      toast.error('Checkout time must be after check-in time.');
      return;
    }

    setLoading(true);
    try {
      await updateDocument('attendance', selectedRecord.id, {
        check_out: checkoutDate.toISOString(),
        data: {
          ...(selectedRecord.data || {}),
          checkOut: checkoutTime,
          notes: workNotes.trim(),
          timestamp: serverTimestamp(),
        }
      });
      toast.success('Past checkout completed successfully!');
      setSelectedRecord(null);
      refetchAttendance();
    } catch (error) {
      console.error(error);
      toast.error('Failed to complete past checkout');
    } finally {
      setLoading(false);
    }
  };

  if (!user || missingCheckoutRecords.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-3 mb-6">
        {missingCheckoutRecords.map(record => (
          <Card key={record.id} className="p-4 border border-amber-200 bg-amber-50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">Missing Checkout</h3>
                  <p className="text-sm text-amber-700">
                    You forgot to check out on {formatDate(record.date, 'dd MMM yyyy')}.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => handleResolveClick(record)} 
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              >
                Resolve
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal 
        open={!!selectedRecord} 
        onClose={handleCloseModal} 
        title={`Complete Checkout for ${selectedRecord ? formatDate(selectedRecord.date, 'dd MMM yyyy') : ''}`}
      >
        {selectedRecord && (
          <div className="space-y-4">
            <p className="text-slate-600 text-sm">
              You checked in at <span className="font-semibold text-slate-800">{new Date(selectedRecord.check_in).toLocaleTimeString('en-US', { hour12: false })}</span>. 
              Please provide your checkout time and notes for this day.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Checkout Time
              </label>
              <input
                type="time"
                step="1"
                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 border border-slate-300"
                value={checkoutTime}
                onChange={(e) => setCheckoutTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Work Notes
              </label>
              <textarea
                className="w-full rounded-xl border-slate-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-3 border border-slate-300"
                rows="4"
                placeholder="E.g., completed task X, fixed bug Y..."
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={handleCloseModal} className="flex-1" disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmitCheckout} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" disabled={loading}>
                {loading ? 'Processing...' : 'Submit & Check Out'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
