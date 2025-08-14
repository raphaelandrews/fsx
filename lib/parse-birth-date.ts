import { parseISO, isValid } from 'date-fns';

export function parseBirthDate(dateInput: string | number | null | undefined): Date | null {
  if (dateInput === null || dateInput === undefined || dateInput === "") {
    return null;
  }

  if (typeof dateInput === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + dateInput * 24 * 60 * 60 * 1000);
    if (isValid(date)) {
      return date;
    }

    throw new Error(`Invalid 'birth' date number format: ${dateInput}`);
  }

  const parsed = parseISO(String(dateInput));
  if (isValid(parsed)) {
    return parsed;
  }

  throw new Error(`Invalid 'birth' date string format: ${dateInput}`);
}
