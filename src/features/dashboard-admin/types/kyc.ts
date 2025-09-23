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
  titleNameEng: string;   
  titleNameThai: string;
};

export type BookbankOrigin = {
  accountNo: string;
  createdAt: string;
  updatedAt: string;
};

export type KycRequestApi = {
  companyId: string;
  correlationId: string;    
  status: string;           
  email: string;            
  requestedAt: string;       
  createdAt: string;         
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
