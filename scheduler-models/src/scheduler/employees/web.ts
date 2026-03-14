import { LeaveStatus } from "./leave";
import { LeaveRequest } from "./leaverequest";
import { Work } from "./work";

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

export interface NewEmployeeLeaveRequest {
  employee: string;
  code: string;
  startdate: Date;
  enddate: Date;
  comment?: string;
}

export interface EmployeeContactSpecialtyUpdate {
  employee: string;
  typeid: number;
  contactid: number;
  value: string;
}

export interface EmployeeSpecialtiesUpdate {
  employee: string;
  action: string;
  specialties: number[];
}

export interface EmployeeWorkResponse {
  employee: string;
  year: number;
  work: Work[];
}