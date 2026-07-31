import { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSupabaseCollection } from '../../hooks/useSupabase';
import { updateDocument } from '../../supabase/db';
import { MegaphoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AnnouncementsBanner() {
  const { user } = useAuth();
  const { items: announcements, loading } = useSupabaseCollection('announcements');

  const visibleAnnouncements = useMemo(() => {
    if (!user) return [];
    
    return announcements.filter(ann => {
      // Must be active
      if (ann.status !== 'active') return false;
      
      // Must target the user's role
      const targets = Array.isArray(ann.target_roles) ? ann.target_roles : [ann.target_roles];
      const isTargeted = targets.includes('all') || targets.includes(user.role);
      if (!isTargeted) return false;

      // Must not be expired (if expires_at is set)
      if (ann.expires_at && new Date(ann.expires_at) < new Date()) return false;

      // Must not be already acknowledged
      const acks = Array.isArray(ann.acknowledged_by) ? ann.acknowledged_by : [];
      if (acks.includes(user.uid)) return false;

      return true;
    });
  }, [announcements, user]);

  const handleAcknowledge = async (announcement) => {
    try {
      const currentAcks = Array.isArray(announcement.acknowledged_by) ? announcement.acknowledged_by : [];
      await updateDocument('announcements', announcement.id, {
        acknowledged_by: [...currentAcks, user.uid]
      });
      toast.success('Announcement acknowledged');
    } catch (error) {
      console.error(error);
      toast.error('Failed to acknowledge announcement');
    }
  };

  if (loading || visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {visibleAnnouncements.map(ann => {
        const isUrgent = ann.priority === 'urgent';
        const isWarning = ann.priority === 'warning';
        
        const bgColor = isUrgent ? 'bg-danger-50' : isWarning ? 'bg-warning-50' : 'bg-primary-50';
        const borderColor = isUrgent ? 'border-danger-200' : isWarning ? 'border-warning-200' : 'border-primary-200';
        const iconColor = isUrgent ? 'text-danger-600' : isWarning ? 'text-warning-600' : 'text-primary-600';
        const buttonClass = isUrgent 
          ? 'bg-danger-600 text-white hover:bg-danger-700' 
          : isWarning 
            ? 'bg-warning-600 text-white hover:bg-warning-700' 
            : 'bg-primary-600 text-white hover:bg-primary-700';

        return (
          <div key={ann.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border ${bgColor} ${borderColor}`}>
            <div className="flex items-start gap-4 flex-1">
              <div className={`p-2 rounded-full bg-white/60 ${iconColor} flex-shrink-0`}>
                <MegaphoneIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className={`font-bold ${isUrgent ? 'text-danger-900' : isWarning ? 'text-warning-900' : 'text-primary-900'}`}>
                  {ann.title}
                </h3>
                <p className={`text-sm mt-1 whitespace-pre-wrap ${isUrgent ? 'text-danger-700' : isWarning ? 'text-warning-700' : 'text-primary-700'}`}>
                  {ann.content}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 self-end sm:self-center">
              <button 
                onClick={() => handleAcknowledge(ann)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${buttonClass}`}
              >
                I've Read This
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
