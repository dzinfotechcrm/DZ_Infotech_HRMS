import { useMemo, useState } from 'react';
import Card from '../ui/Card';
import { GiftIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateHelpers';

export default function UpcomingBirthdays({ employees = [], interns = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();

    const allMembers = [
      ...employees.filter(e => e.status !== 'inactive').map(e => ({ 
        ...e, 
        type: e.role === 'admin' ? 'admin' : e.role || 'employee',
        nameDisplay: `${e.firstName || ''} ${e.lastName || ''}`.trim()
      })),
      ...interns.filter(i => i.status !== 'Terminated' && i.status !== 'Completed').map(i => ({ 
        ...i, 
        type: 'intern', 
        nameDisplay: i.full_name || `${i.first_name || ''} ${i.last_name || ''}`.trim(),
        photoURL: i.photo_url 
      }))
    ];

    const upcomingList = [];

    allMembers.forEach(member => {
      if (member.dob) {
        const dobDate = new Date(member.dob);
        if (isNaN(dobDate)) return;

        // Only current month
        if (dobDate.getMonth() === currentMonth) {
          // Set to this year to calculate days correctly
          const nextBirthday = new Date(today.getFullYear(), dobDate.getMonth(), dobDate.getDate());
          
          upcomingList.push({
            ...member,
            nextBirthday,
            daysUntil: Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });

    // Sort by day of month
    return upcomingList.sort((a, b) => a.nextBirthday.getDate() - b.nextBirthday.getDate());
  }, [employees, interns]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % upcoming.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + upcoming.length) % upcoming.length);
  };

  const person = upcoming[currentIndex];

  return (
    <Card className="p-5 min-w-0 overflow-hidden flex flex-col justify-between" style={{ minHeight: '220px' }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="section-title">This Month's Birthdays</h2>
          <p className="muted-text">Employee birthdays</p>
        </div>
        <GiftIcon className="h-5 w-5 text-primary-600" />
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
              <div className="flex h-16 w-16 mb-3 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-xl font-bold text-primary-700">
                {person.photoURL ? (
                  <img src={person.photoURL} alt={person.nameDisplay} className="h-full w-full object-cover" />
                ) : (
                  `${person.nameDisplay.split(' ')[0]?.[0] || ''}${person.nameDisplay.split(' ')[1]?.[0] || ''}`
                )}
              </div>
              <div className="text-lg font-semibold text-neutral-900">{person.nameDisplay}</div>
              <div className="text-sm text-neutral-500 capitalize mb-2">{person.type}</div>
              <div className="text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                {person.daysUntil === 0 ? 'Today! 🎉' : person.daysUntil === 1 ? 'Tomorrow' : person.daysUntil < 0 ? 'Passed' : `In ${person.daysUntil} days`}
                {' • '}
                {formatDate(person.nextBirthday, 'dd MMM')}
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
            No birthdays this month
          </div>
        )}
      </div>
      
      {upcoming.length > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          {upcoming.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-4 bg-primary-500' : 'w-1.5 bg-neutral-200'}`} 
            />
          ))}
        </div>
      )}
    </Card>
  );
}
