import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getISOWeek, getISOWeekYear, addWeeks } from 'date-fns';
import Button from '../ui/Button';

export default function WeeklyTargetPrompt({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState('');
  const [nextWeekKey, setNextWeekKey] = useState('');

  useEffect(() => {
    // Only show to admins
    if (user?.role !== 'admin') {
      return;
    }

    const checkPrompt = () => {
      const now = new Date();

      // Target is for the upcoming week
      const nextWeekDate = addWeeks(now, 1);
      const weekKey = `${getISOWeekYear(nextWeekDate)}-W${getISOWeek(nextWeekDate)}`;
      setNextWeekKey(weekKey);

      // Condition: Friday 17:00 onwards until Sunday 23:59
      const isFridayAfter5 = now.getDay() === 5 && now.getHours() >= 17;
      const isWeekend = now.getDay() === 6 || now.getDay() === 0;

      if (isFridayAfter5 || isWeekend) {
        const storedTargets = JSON.parse(localStorage.getItem('companyLeadTargets') || '{}');
        if (!storedTargets[weekKey]) {
          setIsOpen(true);
        }
      } else {
        setIsOpen(false);
      }
    };

    checkPrompt();

    // Check periodically in case they leave tab open
    const interval = setInterval(checkPrompt, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!target) return;

    const storedTargets = JSON.parse(localStorage.getItem('companyLeadTargets') || '{}');
    storedTargets[nextWeekKey] = Number(target);
    localStorage.setItem('companyLeadTargets', JSON.stringify(storedTargets));

    setIsOpen(false);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative mx-auto max-w-sm w-full rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-neutral-900">
            Set Next Week's Target
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            Please set the company lead target for the upcoming week.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1.5">
              Next Week Lead Target <span className="text-danger-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full rounded-lg border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-lg py-2 px-3"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="e.g. 50"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full py-2.5 text-base">
            Confirm Target
          </Button>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
