import { addDays, differenceInDays, format, isAfter, isBefore, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, addBusinessDays, isWeekend } from 'date-fns';

export function safeDate(value) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    return parseISO(value);
  }
  if (value?.toDate) {
    return value.toDate();
  }
  return new Date(value);
}

export function formatDate(value, pattern = 'dd MMM yyyy') {
  const date = safeDate(value);
  if (!date || Number.isNaN(date.getTime())) {
    return '—';
  }
  return format(date, pattern);
}

export function formatDateTime(value) {
  const date = safeDate(value);
  if (!date || Number.isNaN(date.getTime())) {
    return '—';
  }
  return format(date, 'dd MMM yyyy, hh:mm a');
}

export function monthRange(date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function daysInMonth(date = new Date()) {
  return eachDayOfInterval(monthRange(date));
}

export function addBusinessDaysSafe(date, days) {
  return addBusinessDays(date, days);
}

export function clampDateRange(start, end) {
  return {
    start: startOfDay(safeDate(start) || new Date()),
    end: startOfDay(safeDate(end) || new Date()),
  };
}

export function isWithinInclusiveRange(date, start, end) {
  const target = safeDate(date);
  const left = safeDate(start);
  const right = safeDate(end);
  if (!target || !left || !right) {
    return false;
  }
  return !isBefore(target, left) && !isAfter(target, right);
}

export function daysBetween(start, end) {
  const a = safeDate(start);
  const b = safeDate(end);
  if (!a || !b) {
    return 0;
  }
  
  if (isAfter(a, b)) return 0;

  const allDays = eachDayOfInterval({ start: a, end: b });
  return allDays.filter(day => !isWeekend(day)).length;
}
