/**
 * This interface will be used for standard update requests.
 */
export interface UpdateRequest {
  id: string;
  optional?: string;
  field: string;
  value: string;
}

export interface Message {
  message: string;
}