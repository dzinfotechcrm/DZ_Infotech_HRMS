import { useMemo } from 'react';
import Card from '../ui/Card';
import { GiftIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/dateHelpers';

export default function UpcomingBirthdays({ employees = [], interns = [] }) {
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

        // Create a date for their birthday THIS year
        let nextBirthday = new Date(today.getFullYear(), dobDate.getMonth(), dobDate.getDate());
        
        // If it already passed this year, it's next year
        if (nextBirthday < today) {
          nextBirthday = new Date(today.getFullYear() + 1, dobDate.getMonth(), dobDate.getDate());
        }

        if (nextBirthday >= today) {
          upcomingList.push({
            ...member,
            nextBirthday,
            daysUntil: Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });

    return upcomingList.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 5);
  }, [employees, interns]);

  return (
    <Card className="p-5 min-w-0 overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="section-title">Upcoming Birthdays</h2>
          <p className="muted-text">Next 5 birthdays</p>
        </div>
        <GiftIcon className="h-5 w-5 text-primary-600" />
      </div>
      <div className="space-y-3 overflow-x-auto pb-2">
        {upcoming.length > 0 ? (
          upcoming.map((person) => (
            <div key={person.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {person.photoURL ? (
                    <img src={person.photoURL} alt={person.nameDisplay} className="h-full w-full object-cover" />
                  ) : (
                    `${person.nameDisplay.split(' ')[0]?.[0] || ''}${person.nameDisplay.split(' ')[1]?.[0] || ''}`
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{person.nameDisplay}</div>
                  <div className="text-xs text-neutral-500 capitalize">{person.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-primary-600">
                  {person.daysUntil === 0 ? 'Today! 🎉' : person.daysUntil === 1 ? 'Tomorrow' : `In ${person.daysUntil} days`}
                </div>
                <div className="text-xs text-neutral-500">
                  {formatDate(person.nextBirthday, 'dd MMM')}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-neutral-500 border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
            No upcoming birthdays
          </div>
        )}
      </div>
    </Card>
  );
}
