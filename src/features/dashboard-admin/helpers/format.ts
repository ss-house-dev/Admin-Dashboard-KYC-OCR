export function fmtDate(iso?: string | null) {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
}

/* ============ Safe field readers ============ */
export function getStringField(obj: unknown, key: string): string | null {
  if (
    obj &&
    typeof obj === "object" &&
    key in (obj as Record<string, unknown>)
  ) {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === "string" && v.trim() !== "" ? v : null;
  }
  return null;
}

export function getNumberField(obj: unknown, key: string): number | null {
  if (
    obj &&
    typeof obj === "object" &&
    key in (obj as Record<string, unknown>)
  ) {
    const v = (obj as Record<string, unknown>)[key];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  }
  return null;
}

/** รวมชื่อให้สวยงาม (first + last) */
export function coalesceName(a?: string | null, b?: string | null) {
  const parts = [a ?? "", b ?? ""].map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts.join(" ") : null;
}

/** ตีเกรดความมั่นใจของเปอร์เซ็นต์ */
export function gradeConfidence(
  pct: number | null | undefined
): "High" | "Moderate" | "Low" | "N/A" {
  if (pct == null) return "N/A";
  if (pct >= 90) return "High"; // 90+
  if (pct >= 70) return "Moderate"; // 70–89
  return "Low"; // <70
}
