import { useEffect } from 'react';
import { useSupabaseCollection } from './useSupabase';
import { upsertDocument, removeDocument } from '../supabase/db';

export function useAmcNotifier() {
  const { items: amcs } = useSupabaseCollection('amcs');
  const { items: clients } = useSupabaseCollection('clients');
  const { items: notifications } = useSupabaseCollection('notifications');

  useEffect(() => {
    if (!amcs.length || !clients.length) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next30Days = new Date(today);
    next30Days.setDate(next30Days.getDate() + 30); // You can adjust the warning period here

    amcs.forEach(async (amc) => {
      if (!amc.renewalDate || amc.status !== 'Active') return;
      
      const renewal = new Date(amc.renewalDate);
      const isExpiring = renewal >= today && renewal <= next30Days;
      const isActive = amc.status === 'Active';

      if (isActive && isExpiring) {
        const client = clients.find(c => c.id === amc.clientId);
        const companyName = client?.companyName || 'Unknown Company';
        
        // Ensure notification ID is unique per AMC per year
        const notificationId = `amc_expiry_${amc.id}_${renewal.getFullYear()}`;
        
        // Check if notification already exists
        const exists = notifications.some(n => n.id === notificationId);
        
        if (!exists) {
          const formattedDate = renewal.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
          const annualValue = amc.annualValue ? `₹${amc.annualValue}` : 'N/A';
          const message = `AMC for ${companyName} is expiring on ${formattedDate}. Annual Value: ${annualValue}`;
          
          try {
            await upsertDocument('notifications', notificationId, {
              type: 'amc_expiry',
              title: 'AMC Expiring Soon',
              message: message,
              data: { amcId: amc.id, clientId: client?.id }
            });
          } catch (err) {
            console.error('Failed to create AMC notification:', err);
          }
        }
      } else {
        // If it's no longer expiring (e.g. renewed or inactive), clean up any existing notification for this AMC
        const existingNotifs = notifications.filter(n => n.type === 'amc_expiry' && n.data?.amcId === amc.id);
        for (const notif of existingNotifs) {
          try {
            await removeDocument('notifications', notif.id);
          } catch (err) {
            console.error('Failed to cleanup AMC notification:', err);
          }
        }
      }
    });
  }, [amcs, clients, notifications]);
}
