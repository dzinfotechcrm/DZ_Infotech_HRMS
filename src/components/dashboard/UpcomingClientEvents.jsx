import { useMemo } from 'react';
import Card from '../ui/Card';
import { GiftIcon, CakeIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateHelpers';

export default function UpcomingClientEvents({ clients = [] }) {
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingList = [];

    clients.forEach(client => {
      // Check Birthday
      if (client.birthday) {
        const bday = new Date(client.birthday);
        if (!isNaN(bday.getTime())) {
          let nextEvent = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
          if (nextEvent < today) {
            nextEvent = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
          }
          upcomingList.push({
            id: `${client.id}-birthday`,
            clientId: client.clientId,
            nameDisplay: client.contactPerson || client.companyName,
            companyName: client.companyName,
            type: 'Birthday',
            nextEvent,
            daysUntil: Math.ceil((nextEvent - today) / (1000 * 60 * 60 * 24))
          });
        }
      }

      // Check Anniversary
      if (client.anniversary) {
        const anniv = new Date(client.anniversary);
        if (!isNaN(anniv.getTime())) {
          let nextEvent = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());
          if (nextEvent < today) {
            nextEvent = new Date(today.getFullYear() + 1, anniv.getMonth(), anniv.getDate());
          }
          upcomingList.push({
            id: `${client.id}-anniversary`,
            clientId: client.clientId,
            nameDisplay: client.companyName,
            companyName: client.companyName,
            type: 'Anniversary',
            nextEvent,
            daysUntil: Math.ceil((nextEvent - today) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });

    return upcomingList.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
  }, [clients]);

  return (
    <Card className="p-5 min-w-0 overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="section-title">Client Events</h2>
          <p className="muted-text">Upcoming birthdays & anniversaries</p>
        </div>
        <GiftIcon className="h-5 w-5 text-primary-600" />
      </div>
      <div className="space-y-3 overflow-x-auto pb-2">
        {upcoming.length > 0 ? (
          upcoming.map((event) => (
            <div key={event.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${event.type === 'Birthday' ? 'bg-pink-100 text-pink-700' : 'bg-purple-100 text-purple-700'}`}>
                  {event.type === 'Birthday' ? <CakeIcon className="h-5 w-5" /> : <SparklesIcon className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{event.nameDisplay}</div>
                  <div className="text-xs text-neutral-500 capitalize">{event.type} • {event.clientId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold ${event.type === 'Birthday' ? 'text-pink-600' : 'text-purple-600'}`}>
                  {event.daysUntil === 0 ? 'Today! 🎉' : event.daysUntil === 1 ? 'Tomorrow' : `In ${event.daysUntil} days`}
                </div>
                <div className="text-xs text-neutral-500">
                  {formatDate(event.nextEvent, 'dd MMM')}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-neutral-500 border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
            No upcoming client events
          </div>
        )}
      </div>
    </Card>
  );
}
