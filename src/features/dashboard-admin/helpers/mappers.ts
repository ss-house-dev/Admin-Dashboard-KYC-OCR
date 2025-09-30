import type { KycRequestApi } from "../types/kyc";
import type { DetailVM } from "../types/detail";
import { coalesceName, getNumberField, getStringField } from "./format";
import { mapStatus } from "./status";

/** ===== Storage base URL (encode `/` → `%2F`) ===== */
const STORAGE_BASE: string =
  (
    process.env.NEXT_PUBLIC_STORAGE_BASE_URL ??
    "http://141.11.156.52:3208/storage/files/"
  ).replace(/\/+$/, "") + "/";

/** same-origin proxy prefix ที่เราสร้างไว้: /api/storage/files/[...path] */
const PROXY_BASE = "/api/storage/files/";

/** สร้าง URL ไปหารูป โดยเลือกเส้นทางที่ปลอดภัยอัตโนมัติ */
function buildStorageUrl(filename?: string | null): string | null {
  if (!filename || filename.trim() === "") return null;

  const base = STORAGE_BASE.replace(/\/+$/, "") + "/";

  // 1) ถ้าใช้พร็อกซีของแอปอยู่แล้ว → อย่า encode '/'
  if (base.startsWith(PROXY_BASE)) {
    // ตัวอย่าง: /api/storage/files/68db.../face/verify/file.jpg
    return base + filename;
  }

  // 2) ถ้าหน้าเว็บเป็น HTTPS แต่ base เป็น HTTP → บังคับผ่านพร็อกซี เพื่อกัน mixed content
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    base.startsWith("http://")
  ) {
    return PROXY_BASE + filename;
  }

  // 3) ยิงตรง MinIO → ต้อง encode ทั้ง path ("/" → "%2F")
  return base + encodeURIComponent(filename);
}

// ดึงจาก idcardEdit” และ “แปลง / → - เฉพาะสองฟิลด์
function slashToHyphen(input?: string | null): string | null {
  if (input == null) return null;
  return input.includes("/") ? input.replace(/\//g, "-") : input;
}

/** โครงสร้าง images แต่ละ entry (ไม่แก้ type ต้นฉบับ) */
type KycImageEntry = {
  type: string;
  fileNames: string[];
};

/** type guard: ตรวจว่าเป็น KycImageEntry */
function isImageEntry(u: unknown): u is KycImageEntry {
  if (!u || typeof u !== "object") return false;
  const o = u as { type?: unknown; fileNames?: unknown };
  if (typeof o.type !== "string") return false;
  if (!Array.isArray(o.fileNames)) return false;
  return o.fileNames.every((f) => typeof f === "string");
}

/** ดึง images[] อย่างปลอดภัย */
function getImages(api: KycRequestApi): KycImageEntry[] | null {
  const imgsUnknown = (api as unknown as { images?: unknown }).images;
  if (!Array.isArray(imgsUnknown)) return null;
  const imgs: KycImageEntry[] = [];
  for (const e of imgsUnknown) {
    if (isImageEntry(e)) imgs.push(e);
  }
  return imgs.length ? imgs : null;
}

/** หา URL ของไฟล์ "รายการสุดท้าย" ของ type ที่ต้องการ */
function resolveLastImageUrl(api: KycRequestApi, type: string): string | null {
  const images = getImages(api);
  if (!images) return null;
  const entry = images.find((x) => x.type.toLowerCase() === type.toLowerCase());
  if (!entry || entry.fileNames.length === 0) return null;
  const last = entry.fileNames[entry.fileNames.length - 1];
  return buildStorageUrl(last);
}

/** หา URL ของไฟล์ "รายการแรก" ของ type ที่ต้องการ */
function resolveFirstImageUrl(api: KycRequestApi, type: string): string | null {
  const images = getImages(api);
  if (!images) return null;
  const entry = images.find((x) => x.type.toLowerCase() === type.toLowerCase());
  if (!entry || entry.fileNames.length === 0) return null;
  const first = entry.fileNames[0];
  return buildStorageUrl(first);
}

/** ดึง confidence (%) จาก api.face.confidence (0..1) → 0..100 */
function getFaceConfidencePercent(api: KycRequestApi): number | null {
  const faceUnknown = (api as unknown as { face?: unknown }).face;
  if (!faceUnknown || typeof faceUnknown !== "object") return null;
  const conf = (faceUnknown as { confidence?: unknown }).confidence;
  if (typeof conf !== "number" || !Number.isFinite(conf)) return null;
  const pct = Math.round(conf * 100);
  return pct;
}

/** สรุปตรรกะ match ชื่อบัญชีธนาคารแบบ strict 100/100 */
function computeBankNameMatch(api: KycRequestApi): boolean | null {
  const ct = api.crossThaiNameMatchPercent;
  const ce = api.crossEnglishNameMatchPercent;
  if (ct == null && ce == null) return null;
  return (ct ?? 0) === 100 && (ce ?? 0) === 100;
}

/** แปลง API → ViewModel (คงตรรกะและ fields เท่าเดิม) */
export function fromApiToDetailVM(api: KycRequestApi): DetailVM {
  const fullNameThai =
    coalesceName(api.idcardEdit?.firstNameThai, api.idcardEdit?.lastNameThai) ??
    coalesceName(
      api.idcardOrigin?.firstNameThai,
      api.idcardOrigin?.lastNameThai
    );

  const fullNameEng =
    coalesceName(api.idcardEdit?.firstNameEng, api.idcardEdit?.lastNameEng) ??
    coalesceName(api.idcardOrigin?.firstNameEng, api.idcardOrigin?.lastNameEng);

  /* ===== เพิ่มเติมรูปจาก images[] =====
     - idcard-front → ใช้รูป "รายการสุดท้าย"
     - bookbank     → ใช้รูป "รายการสุดท้าย"
     - face-verify  → ID Photo (ใช้รูปสุดท้าย; ปกติ 1 ไฟล์)
     - face-create  → Selfie (ใช้ "รูปแรก" ตามคำสั่ง)
  */
  const idcardFromImages = resolveLastImageUrl(api, "idcard-front");
  const bookbankFromImages = resolveLastImageUrl(api, "bookbank");
  const idPhotoFromImages = resolveLastImageUrl(api, "face-verify");
  const selfieFromImages = resolveFirstImageUrl(api, "face-create");

  // ===== DataLog mapping =====
  const idThaiOriginal =
    coalesceName(
      api.idcardOrigin?.firstNameThai,
      api.idcardOrigin?.lastNameThai
    ) ?? null;
  const idThaiEdited =
    coalesceName(api.idcardEdit?.firstNameThai, api.idcardEdit?.lastNameThai) ??
    null;
  const idThaiPct: number | null = api.idcardThaiNameMatchPercent ?? null;
  const idThaiEditedForUI = idThaiPct === 100 ? null : idThaiEdited;

  const idEngOriginal =
    coalesceName(
      api.idcardOrigin?.firstNameEng,
      api.idcardOrigin?.lastNameEng
    ) ?? null;
  const idEngEdited =
    coalesceName(api.idcardEdit?.firstNameEng, api.idcardEdit?.lastNameEng) ??
    null;
  const idEngPct: number | null = api.idcardEnglishNameMatchPercent ?? null;
  const idEngEditedForUI = idEngPct === 100 ? null : idEngEdited;

  const bbThaiOriginal: string | null =
    api.bookbankOrigin?.accountNameThai ?? null;
  const bbThaiEdited: string | null = api.bookbankEdit?.accountNameThai ?? null;
  const bbThaiPct: number | null = api.bookbankThaiNameMatchPercent ?? null;
  const bbThaiEditedForUI = bbThaiPct === 100 ? null : bbThaiEdited;

  const bbEngOriginal: string | null =
    api.bookbankOrigin?.accountNameEng ?? null;
  const bbEngEdited: string | null = api.bookbankEdit?.accountNameEng ?? null;
  const bbEngPct: number | null = api.bookbankEnglishNameMatchPercent ?? null;
  const bbEngEditedForUI = bbEngPct === 100 ? null : bbEngEdited;

  /* ===== Face confidence (%) =====
     - ใช้ api.face.confidence (0..1) → round → 0..100
     - ถ้าไม่มี ใช้ฟิลด์เดิม faceMatchPercent (ถ้ามี) เป็น fallback
  */
  const facePct =
    getFaceConfidencePercent(api) ?? getNumberField(api, "faceMatchPercent");

  return {
    requestId: api.id,
    transactionNo: api.correlationId ?? undefined,
    status: mapStatus(api.status),

    // ID Card
    idcardImageUrl: idcardFromImages ?? getStringField(api, "idcardImageUrl"),
    fullNameThai,
    fullNameEng,
    idNumber: api.idcardEdit?.idNumber ?? null,
    laserId: getStringField(api.idcardEdit, "laserId"),
    dateOfBirth: slashToHyphen(api.idcardEdit?.dateOfBirth),
    dateOfExpiry: slashToHyphen(api.idcardEdit?.dateOfExpiry),

    // Face
    idPhotoUrl: idPhotoFromImages ?? getStringField(api, "idPhotoUrl"),
    selfieUrl: selfieFromImages ?? getStringField(api, "selfieUrl"),
    faceMatchPercent: facePct,

    // Bank
    bankBookImageUrl:
      bookbankFromImages ?? getStringField(api, "bankBookImageUrl"),
    accountName:
      api.bookbankEdit?.accountNameThai ??
      api.bookbankOrigin?.accountNameThai ??
      api.bookbankEdit?.accountNameEng ??
      api.bookbankOrigin?.accountNameEng ??
      null,
    accountNumber:
      api.bookbankOrigin?.accountNo ?? api.bookbankEdit?.accountNo ?? null,
    bank: api.bookbankEdit?.bankName ?? null,
    branch: api.bookbankEdit?.branchName ?? null,
    bankNameMatch: computeBankNameMatch(api),

    dataLog: {
      idCard: {
        thaiOriginalName: idThaiOriginal,
        thaiEditedName: idThaiEditedForUI,
        thaiSimilarityPercent: idThaiPct,
        engOriginalName: idEngOriginal,
        engEditedName: idEngEditedForUI,
        engSimilarityPercent: idEngPct,
      },
      bankBook: {
        thaiOriginalName: bbThaiOriginal,
        thaiEditedName: bbThaiEditedForUI,
        thaiSimilarityPercent: bbThaiPct,
        engOriginalName: bbEngOriginal,
        engEditedName: bbEngEditedForUI,
        engSimilarityPercent: bbEngPct,
      },
    },
  };
}
