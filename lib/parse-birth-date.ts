export function parseBirthDate(birth: string | number | null | undefined): Date | null | undefined {
  if (birth === undefined) {
    return undefined;
  }
  if (birth === null) {
    return null;
  }

  if (typeof birth === 'string' && birth) {
    const parsed = new Date(birth);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    throw new Error("Invalid 'birth' date string format.");
  } if (typeof birth === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const msPerDay = 24 * 60 * 60 * 1000;
    const parsed = new Date(excelEpoch.getTime() + (birth * msPerDay));
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
    throw new Error("Invalid 'birth' Excel number format.");
  }
  throw new Error("Invalid 'birth' field type. Must be string, number, or null.");
}
