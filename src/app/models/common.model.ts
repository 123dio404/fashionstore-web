export type UUID = string;

export interface ValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

export interface HttpValidationError {
  detail: ValidationError[];
}
