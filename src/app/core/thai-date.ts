const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatThaiDate(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatThaiTime(isoString: string): string {
  const date = new Date(isoString);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatThaiDateRange(startIso: string, endIso: string): string {
  return `${formatThaiDate(startIso)} • ${formatThaiTime(startIso)} - ${formatThaiTime(endIso)} น.`;
}

/**
 * ฟอร์มแอดมินมีแค่ช่องวันที่แบบข้อความเดียว (ไม่มีเวลา) เช่น "24 พ.ย. 2024"
 * ฟังก์ชันนี้แปลงกลับเป็นช่วงเวลา ISO โดยตั้งเวลาเริ่ม 09:00 และเวลาสิ้นสุด 17:00
 */
export function parseThaiDateToIsoRange(
  text: string
): { start: string; end: string } | null {
  const match = text.trim().match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (!match) return null;

  const [, dayStr, monthStr, yearStr] = match;
  const monthIndex = THAI_MONTHS.indexOf(monthStr);
  if (monthIndex === -1) return null;

  const day = Number(dayStr);
  const year = Number(yearStr);

  const toIso = (hour: number, minute: number) =>
    `${year}-${pad(monthIndex + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;

  return { start: toIso(9, 0), end: toIso(17, 0) };
}
