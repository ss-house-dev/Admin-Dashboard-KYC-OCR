import type { KycRequestApi } from "../types/kyc";
import type { DetailVM } from "../types/detail";
import { coalesceName, getNumberField, getStringField } from "./format";
import { mapStatus } from "./status";

/** ====== Storage base URL สำหรับ MinIO (แก้ได้ด้วย env) ====== */
const STORAGE_BASE: string =
  (
    process.env.NEXT_PUBLIC_STORAGE_BASE_URL ??
    "http://141.11.156.52:3208/storage/files/"
  ).replace(/\/+$/, "") + "/";

/** สร้าง URL สำหรับไฟล์จาก MinIO */
function buildStorageUrl(filename?: string | null): string | null {
  if (!filename || filename.trim() === "") return null;
  return STORAGE_BASE + filename;
}

/** โครงสร้าง entry ของ images (ไม่ไปแก้ type ต้นฉบับ) */
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

/** ดึง images[] อย่างปลอดภัย โดยไม่ใช้ any */
function getImages(api: KycRequestApi): KycImageEntry[] | null {
  const container = api as unknown as { images?: unknown };
  const imgsUnknown = container?.images;
  if (!Array.isArray(imgsUnknown)) return null;
  const imgs: KycImageEntry[] = [];
  for (const e of imgsUnknown) {
    if (isImageEntry(e)) imgs.push(e);
  }
  return imgs.length ? imgs : null;
}

/** หาไฟล์ล่าสุดของประเภทที่ต้องการ แล้วคืน URL สำหรับแสดงผล */
function resolveImageUrlFromImages(
  api: KycRequestApi,
  type: "bookbank" | "idcard-front"
): string | null {
  const images = getImages(api);
  if (!images) return null;
  const entry = images.find((x) => x.type.toLowerCase() === type);
  if (!entry || entry.fileNames.length === 0) return null;
  const last = entry.fileNames[entry.fileNames.length - 1];
  return buildStorageUrl(last);
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

  // ===== ดึง URL รูปจาก images[] (ใหม่) =====
  const idcardFromImages = resolveImageUrlFromImages(api, "idcard-front");
  const bookbankFromImages = resolveImageUrlFromImages(api, "bookbank");

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

  return {
    requestId: api.id,
    transactionNo: api.correlationId ?? undefined,
    status: mapStatus(api.status),

    // ID Card
    // ⬇️ เพิ่ม fallback จาก images[] ก่อน แล้วค่อย fallback ฟิลด์เดิม
    idcardImageUrl: idcardFromImages ?? getStringField(api, "idcardImageUrl"),
    fullNameThai,
    fullNameEng,
    idNumber: api.idcardEdit?.idNumber ?? null,
    laserId: getStringField(api.idcardEdit, "laserId"),
    dateOfBirth: api.idcardEdit?.dateOfBirth ?? null,
    dateOfExpiry: api.idcardEdit?.dateOfExpiry ?? null,

    // Face
    idPhotoUrl: getStringField(api, "idPhotoUrl"),
    selfieUrl: getStringField(api, "selfieUrl"),
    faceMatchPercent: getNumberField(api, "faceMatchPercent"),

    // Bank
    // ⬇️ เพิ่ม fallback จาก images[] ก่อน แล้วค่อย fallback ฟิลด์เดิม
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
