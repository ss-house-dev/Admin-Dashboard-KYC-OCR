// =============== ตรงตาม response ===============
export type KycFiltersApplied = {
  companyId: string;
  correlationId: boolean;
  email: boolean;
  firstNameThai: boolean;
  lastNameThai: boolean;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  embed: boolean;
  completedOnly: boolean;
};

export type IdcardDoc = {
  address: string;
  createdAt: string;
  updatedAt: string;
  dateOfBirth: string;
  dateOfExpiry: string;
  dateOfIssue: string;
  firstNameEng: string;
  firstNameThai: string;
  idNumber: string;
  lastNameEng: string;
  lastNameThai: string;
  titleNameEng: string;   // บางครั้งอาจเป็น "null" (string) ตามตัวอย่าง
  titleNameThai: string;
};

export type BookbankOrigin = {
  accountNo: string;
  createdAt: string;
  updatedAt: string;
};

export type KycRequestApi = {
  companyId: string;
  correlationId: string;     // ใช้เป็น transactionNo ตามโจทย์
  status: string;            // อาจว่าง ""
  email: string;             // อาจว่าง ""
  requestedAt: string;       // มีมา แต่โจทย์ต้องใช้ createdAt
  createdAt: string;         // ✅ ใช้อันนี้ทำวันที่/เวลา
  updatedAt: string;
  idcardThaiNameMatchPercent: number | null;
  idcardEnglishNameMatchPercent: number | null;
  bookbankThaiNameMatchPercent: number | null;
  bookbankEnglishNameMatchPercent: number | null;
  crossThaiNameMatchPercent: number | null;
  crossEnglishNameMatchPercent: number | null;
  idcardOrigin: IdcardDoc;
  idcardEdit: IdcardDoc;
  bookbankOrigin: BookbankOrigin;
  images: unknown[];
  id: string;
};

export type CompanyAllData = {
  total: number;
  page: number;
  pages: number;
  limit: number;
  filtersApplied: KycFiltersApplied;
  items: KycRequestApi[];
};
