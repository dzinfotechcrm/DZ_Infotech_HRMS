import { useMemo, useState } from 'react';
import Card from '../ui/Card';
import { SparklesIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateHelpers';

export default function UpcomingClientEvents({ clients = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();

    const upcomingList = [];

    clients.forEach(client => {
      // Check Anniversary only
      if (client.anniversary) {
        const anniv = new Date(client.anniversary);
        if (!isNaN(anniv.getTime())) {
          if (anniv.getMonth() === currentMonth) {
            const nextEvent = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate());
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
      }
    });

    return upcomingList.sort((a, b) => a.nextEvent.getDate() - b.nextEvent.getDate());
  }, [clients]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % upcoming.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + upcoming.length) % upcoming.length);
  };

  const event = upcoming[currentIndex];

  return (
    <Card className="p-4 min-w-0 overflow-hidden flex flex-col justify-between flex-1" style={{ minHeight: '200px' }}>
      <div className="mb-3 flex items-center justify-between shrink-0">
        <div>
          <h2 className="section-title">This Month's Anniversaries</h2>
          <p className="muted-text">Client Anniversaries</p>
        </div>
        <SparklesIcon className="h-5 w-5 text-purple-600" />
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        {upcoming.length > 0 ? (
          <div className="flex items-center w-full justify-between">
            <button 
              onClick={prevSlide}
              className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
              disabled={upcoming.length <= 1}
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            
            <div className="flex flex-col items-center text-center px-4">
              <div className="flex h-12 w-12 mb-2 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-100 text-purple-700">
                <SparklesIcon className="h-6 w-6" />
              </div>
              <div className="text-base font-semibold text-neutral-900">{event.nameDisplay}</div>
              <div className="text-sm text-neutral-500 mb-1">{event.clientId}</div>
              <div className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                {event.daysUntil === 0 ? 'Today! 🎉' : event.daysUntil === 1 ? 'Tomorrow' : event.daysUntil < 0 ? 'Passed' : `In ${event.daysUntil} days`}
                {' • '}
                {formatDate(event.nextEvent, 'dd MMM')}
              </div>
            </div>

            <button 
              onClick={nextSlide}
              className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
              disabled={upcoming.length <= 1}
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>
        ) : (
          <div className="w-full p-6 text-center text-sm text-neutral-500 border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
            No client anniversaries this month
          </div>
        )}
      </div>

      {upcoming.length > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {upcoming.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-purple-500' : 'w-1.5 bg-neutral-200'}`} 
            />
          ))}
        </div>
      )}
    </Card>
  );
}
