const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatThaiDate(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  return `${date.getDate()} ${THAI_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatThaiTime(isoString: string): string {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '00:00';
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatThaiDateRange(startIso: string, endIso: string): string {
  return `${formatThaiDate(startIso)} • ${formatThaiTime(startIso)} - ${formatThaiTime(endIso)} น.`;
}

/**
 * แปลงวันที่จากฟอร์ม (รองรับทั้งแบบ DD/MM/YYYY, DD-MM-YYYY, ISO YYYY-MM-DD, หรือแบบไทย "24 พ.ย. 2024")
 * เป็นช่วงวันเวลา start_date และ end_date (ISO 8601)
 */
export function parseThaiDateToIsoRange(
  text: string,
  startTime: string = '09:00',
  endTime: string = '17:00'
): { start: string; end: string } | null {
  if (!text) return null;
  const trimmed = text.trim();

  // 1. แบบ ISO YYYY-MM-DD หรือ YYYY-MM-DDTHH:mm (เช่น จาก <input type="date">)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T(\d{1,2}):(\d{1,2}))?$/);
  if (isoMatch) {
    const [, y, m, d, h, min] = isoMatch;
    const [sH, sM] = (startTime || '09:00').split(':').map(Number);
    const [eH, eM] = (endTime || '17:00').split(':').map(Number);
    const startHour = h !== undefined ? Number(h) : (isNaN(sH) ? 9 : sH);
    const startMin = min !== undefined ? Number(min) : (isNaN(sM) ? 0 : sM);
    const endHour = isNaN(eH) ? 17 : eH;
    const endMin = isNaN(eM) ? 0 : eM;
    return {
      start: `${y}-${pad(Number(m))}-${pad(Number(d))}T${pad(startHour)}:${pad(startMin)}:00`,
      end: `${y}-${pad(Number(m))}-${pad(Number(d))}T${pad(endHour)}:${pad(endMin)}:00`,
    };
  }

  // 2. แบบ DD/MM/YYYY หรือ DD-MM-YYYY (เช่น 24/11/2024 หรือ 24/11/2567)
  const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2}))?$/);
  if (slashMatch) {
    const [, d, m, y, sH, sM, eH, eM] = slashMatch;
    let year = Number(y);
    if (year > 2400) year -= 543;
    const [defSH, defSM] = (startTime || '09:00').split(':').map(Number);
    const [defEH, defEM] = (endTime || '17:00').split(':').map(Number);
    const startHour = sH ? Number(sH) : (isNaN(defSH) ? 9 : defSH);
    const startMin = sM ? Number(sM) : (isNaN(defSM) ? 0 : defSM);
    const endHour = eH ? Number(eH) : (isNaN(defEH) ? 17 : defEH);
    const endMin = eM ? Number(eM) : (isNaN(defEM) ? 0 : defEM);
    return {
      start: `${year}-${pad(Number(m))}-${pad(Number(d))}T${pad(startHour)}:${pad(startMin)}:00`,
      end: `${year}-${pad(Number(m))}-${pad(Number(d))}T${pad(endHour)}:${pad(endMin)}:00`,
    };
  }

  // 3. แบบไทย: 24 พ.ย. 2024 หรือ 24 พฤศจิกายน 2567 หรือ 24 พ.ย. 2024 09:00 - 17:00
  const match = trimmed.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2}))?$/);
  if (!match) return null;

  const [, dayStr, monthStr, yearStr, sH, sM, eH, eM] = match;
  let monthIndex = THAI_MONTHS_SHORT.indexOf(monthStr);
  if (monthIndex === -1) {
    monthIndex = THAI_MONTHS_FULL.indexOf(monthStr);
  }
  if (monthIndex === -1) return null;

  const day = Number(dayStr);
  let year = Number(yearStr);
  if (year > 2400) {
    year -= 543;
  }

  const [defSH, defSM] = (startTime || '09:00').split(':').map(Number);
  const [defEH, defEM] = (endTime || '17:00').split(':').map(Number);
  const startHour = sH ? Number(sH) : (isNaN(defSH) ? 9 : defSH);
  const startMin = sM ? Number(sM) : (isNaN(defSM) ? 0 : defSM);
  const endHour = eH ? Number(eH) : (isNaN(defEH) ? 17 : defEH);
  const endMin = eM ? Number(eM) : (isNaN(defEM) ? 0 : defEM);

  const toIso = (hour: number, minute: number) =>
    `${year}-${pad(monthIndex + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00`;

  return { start: toIso(startHour, startMin), end: toIso(endHour, endMin) };
}
