/** Display day numbers are identities, not array indices. */
export function itineraryDayNumber(day: { day?: number; dayNumber?: number }, index: number): number {
    const number = day.dayNumber ?? day.day;
    return typeof number === 'number' && Number.isInteger(number) && number > 0 ? number : index + 1;
}
export function itineraryDayIndex(days: { day?: number; dayNumber?: number }[], number: number): number {
    return days.findIndex((day, index) => itineraryDayNumber(day, index) === number);
}
