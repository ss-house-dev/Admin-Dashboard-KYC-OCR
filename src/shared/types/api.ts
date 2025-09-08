export interface ApiErrorResponse {
  message?: string;
  errors?: Array<{ field?: string | string[]; message?: string }>;
  code?: string;
}
