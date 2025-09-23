export function toYmd(date?: Date): string {
  if (!date) return "";
  // ชดเชย offset เพื่อให้ได้ "local date" ก่อนค่อยแปลงเป็น ISO string
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// dd-mm-yyyy -> yyyy-mm-dd (เผื่อยังอยากใช้จงใจ)
export function ddmmyyyyToIso(s: string): string {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
  if (!m) return s;
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

// ISO -> สำหรับแสดงผลในตาราง
export function formatFromIso(iso?: string): { date: string; time: string } {
  if (!iso) return { date: "-", time: "-" };
  const dt = new Date(iso);
  if (isNaN(+dt)) return { date: "-", time: "-" };

  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const hh = String(dt.getHours()).padStart(2, "0");
  const mi = String(dt.getMinutes()).padStart(2, "0");
  const ss = String(dt.getSeconds()).padStart(2, "0");

  return { date: `${dd}-${mm}-${yyyy}`, time: `${hh}:${mi}:${ss}` };
}

/**
 * แปลง Date → ISO string ที่เป็นช่วงเวลาเริ่มต้นวัน (00:00:00Z)
 */
export function toStartOfDayZ(d?: Date) {
  const ymd = toYmd(d);
  return ymd ? `${ymd}T00:00:00Z` : undefined;
}

/**
 * แปลง Date → ISO string ที่เป็นช่วงเวลาสิ้นสุดวัน (23:59:59Z)
 */
export function toEndOfDayZ(d?: Date) {
  const ymd = toYmd(d);
  return ymd ? `${ymd}T23:59:59Z` : undefined;
}
