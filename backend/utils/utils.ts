const getMonthBoundary = (year: number, month: number, isEnd: boolean): Date => {
  return new Date(year, isEnd ? month + 1 : month, isEnd ? 0 : 1);
};

const getYearBoundary = (year: number, isEnd: boolean): Date => {
  return new Date(year, isEnd ? 11 : 0, isEnd ? 31 : 1);
};

export const getFirstDayOfMonth = (date: string): Date => {
  const newDate = new Date(date);
  return getMonthBoundary(newDate.getFullYear(), newDate.getMonth(), false);
};

export const getLastDayOfMonth = (date: string): Date => {
  const newDate = new Date(date);
  return getMonthBoundary(newDate.getFullYear(), newDate.getMonth(), true);
};

export const getFirstDayOfYear = (date: string): Date => {
  const newDate = new Date(date);
  return getYearBoundary(newDate.getFullYear(), false);
};

export const getLastDayOfYear = (date: string): Date => {
  const newDate = new Date(date);
  return getYearBoundary(newDate.getFullYear(), true);
};

export const getDateFromRange = (range: string): { start: Date; end: Date } => {
  const [start, end] = range.split(" to ");
  return { start: new Date(start), end: new Date(end) };
};
