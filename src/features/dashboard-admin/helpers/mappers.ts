import type { KycRequestApi } from "../types/kyc";
import type { DetailVM } from "../types/detail";
import { coalesceName, getNumberField, getStringField } from "./format";
import { mapStatus } from "./status";

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
    idcardImageUrl: getStringField(api, "idcardImageUrl"),
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
    bankBookImageUrl: getStringField(api, "bankBookImageUrl"),
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
