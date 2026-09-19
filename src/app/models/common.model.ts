export type UUID = string;
export type Id = number;

export interface ValidationError {
  loc: Array<string | number>;
  msg: string;
  type: string;
}

export interface HttpValidationError {
  detail: ValidationError[];
}
