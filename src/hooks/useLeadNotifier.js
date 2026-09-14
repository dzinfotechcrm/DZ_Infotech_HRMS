import { useEffect } from 'react';
import { useSupabaseCollection } from './useSupabase';
import { upsertDocument } from '../supabase/db';
import { useAuth } from './useAuth';

export function useLeadNotifier() {
  const { user } = useAuth();
  const { items: leads } = useSupabaseCollection('leads');
  const { items: notifications } = useSupabaseCollection('notifications');

  useEffect(() => {
    if (!leads.length || !user || !notifications) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    leads.forEach(async (lead) => {
      // Check if lead is assigned to current user
      if (lead.assignedTo !== user.uid && lead.assignedTo !== user.id) return;
      
      // Check if there's a follow-up date
      if (!lead.nextFollowUp) return;

      const followupDate = new Date(lead.nextFollowUp);
      followupDate.setHours(0, 0, 0, 0);

      // We notify if the followup date is exactly today
      if (followupDate.getTime() === today.getTime()) {
        const leadName = lead.clientName || lead.companyName || 'Unknown Lead';
        
        // Ensure notification ID is unique per lead per day
        const notificationId = `lead_followup_${lead.id}_${today.getTime()}`;
        
        // Check if notification already exists
        const exists = notifications.some(n => n.id === notificationId);
        
        if (!exists) {
          const message = `You have a follow-up scheduled today for lead: ${leadName}.`;
          
          try {
            await upsertDocument('notifications', notificationId, {
              type: 'lead_followup',
              title: 'Lead Follow-up Today',
              message: message,
              user_id: user.uid || user.id,
              data: { leadId: lead.id, userId: user.uid || user.id }
            });
          } catch (err) {
            console.error('Failed to create lead notification:', err);
          }
        }
      }
    });
  }, [leads, notifications, user]);
}
