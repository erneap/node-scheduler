import { LeaveRequest } from "./leaverequest";

export interface ChangeLeaveRequestResponse {
  message: string;
  leaverequest: LeaveRequest | undefined;
  error: Error | undefined;
}

export interface NewEmployeeAssignment {
  employee: string;
  site: string;
  workcenter: string;
  start: Date;
  scheduledays: number;
}

export interface ChangeAssignment {
  employee: string;
  asgmt: number;
  schedule?: number;
  workday?: number;
  field: string;
  value: string;
}