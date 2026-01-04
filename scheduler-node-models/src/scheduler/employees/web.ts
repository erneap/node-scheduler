import { LeaveStatus } from "./leave";
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

export interface NewLeaveRequest {
  employee: string;
  leavedate: Date;
  code: string;
  status: LeaveStatus;
  hours: number;
  holcode?: string;
}

export interface UpdateLeave {
  employee: string;
  leaveid: number;
  field: string;
  value: string;
}

export interface NewLeaveBalance {
  employee: string;
  year: number;
}

export interface UpdateLeaveBalance {
  employee: string;
  year: number;
  field: string;
  value: number;
}