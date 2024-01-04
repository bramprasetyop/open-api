export const REDIS_CACHE_TTL = 24 * 60 * 60 * 1000;
export const SEQUELIZE = 'SEQUELIZE';
export const DEVELOPMENT = 'development';
export const TEST = 'test';
export const PRODUCTION = 'production';
export const EMPLOYEE_REPOSITORY = 'EMPLOYEE_REPOSITORY';
export const USER_REPOSITORY = 'USER_REPOSITORY';
export const PROCEDURES_REPOSITORY = 'PROCEDURES_REPOSITORY';
export const OPEN_API_REPOSITORY = 'OPEN_API_REPOSITORY';
export const SESSION_PREFIX = 'ses_';
export const USER_SESSION_PREFIX = 'SESS_';
export const USER_DATA_PREFIX = 'DATA_';
export const COMPANY_DOCUMENT_CUTOFF_REPOSITORY =
  'COMPANY_DOCUMENT_CUTOFF_REPOSITORY';
export const CLAIMS_REPOSITORY = 'CLAIMS_REPOSITORY';
export const CLAIM_DOCUMENTS_REPOSITORY = 'CLAIM_DOCUMENTS_REPOSITORY';
export const CLAIMS_DOCUMENT_TYPE = {
  0: 'fpm',
  1: 'kuitansi',
  2: 'resep',
  3: 'lainnya'
};
export const CLAIMS_PLAN_TYPE = {
  0: 'RAWAT JALAN',
  1: 'RAWAT GIGI',
  2: 'KACAMATA',
  3: 'RAWAT INAP'
};

export const CLAIM_STATUS = {
  DRAFT: 'Draf',
  SUBMITTED: 'Sudah Diajukan',
  COMPLETED: 'Sudah Dibayar',
  REJECTED: 'Ditolak',
  REJECTED_REVISE: 'Pending Kelengkapan Dokumen'
};
