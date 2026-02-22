export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotDuration: number,
  bookedSlots: string[] = []
): { time: string; available: boolean }[] {
  const slots: { time: string; available: boolean }[] = [];

  const [openH, openM] = openTime.split(":").map(Number);
  const [closeH, closeM] = closeTime.split(":").map(Number);

  let currentMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  while (currentMinutes + slotDuration <= closeMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    slots.push({ time, available: !bookedSlots.includes(time) });
    currentMinutes += slotDuration;
  }

  return slots;
}

export function getDayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function isWorkingDay(dateStr: string, workingDays: string): boolean {
  const dayOfWeek = getDayOfWeek(dateStr);
  const days = workingDays.split(",").map(Number);
  return days.includes(dayOfWeek);
}
