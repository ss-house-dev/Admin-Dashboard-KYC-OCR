export type ConfirmKind = "approve" | "reject" | "override";

export type UiStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Approved Override"
  | "Rejected Override";

/** ViewModel สำหรับ Data Log (ยืดหยุ่น/optional) — คง shape เดิมเพื่อความเข้ากันได้กับ DetailDataLog */
export type DataLogVM = {
  idCard?: {
    thaiOriginalName?: string | null;
    thaiEditedName?: string | null;
    thaiSimilarityPercent?: number | null; // 0..100
    engOriginalName?: string | null;
    engEditedName?: string | null;
    engSimilarityPercent?: number | null; // 0..100
    laserId: string | null;
  };
  bankBook?: {
    thaiOriginalName?: string | null;
    thaiEditedName?: string | null;
    thaiSimilarityPercent?: number | null; // 0..100
    engOriginalName?: string | null;
    engEditedName?: string | null;
    engSimilarityPercent?: number | null; // 0..100
  };
};

export type DetailVM = {
  requestId?: string;
  transactionNo?: string;
  status?: UiStatus;

  // ID Card
  idcardImageUrl?: string | null;
  fullNameThai?: string | null;
  fullNameEng?: string | null;
  idNumber?: string | null;
  laserId?: string | null;
  dateOfBirth?: string | null;
  dateOfExpiry?: string | null;

  // Face
  idPhotoUrl?: string | null;
  selfieUrl?: string | null;
  faceMatchPercent?: number | null;

  // Bank
  bankBookImageUrl?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  bank?: string | null;
  branch?: string | null;
  bankNameMatch?: boolean | null;

  // Data Log
  dataLog?: DataLogVM | null;
};
