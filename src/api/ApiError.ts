/** Error de la API con la forma `{ code, message, details }` del contrato. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown[];

  constructor(status: number, code: string, message: string, details: unknown[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ErrorInfo {
  message: string;
  code: string | null;
}

/** Convierte cualquier error en algo mostrable: el mensaje del back tal cual llega. */
export function toErrorInfo(error: unknown): ErrorInfo {
  if (error instanceof ApiError) return { message: error.message, code: error.code };
  if (error instanceof Error && error.message) return { message: error.message, code: null };
  return { message: 'Ocurrió un error inesperado.', code: null };
}
