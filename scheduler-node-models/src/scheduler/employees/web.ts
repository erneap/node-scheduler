import { LeaveRequest } from "./leaverequest";

export interface ChangeLeaveRequestResponse {
  message: string;
  leaverequest: LeaveRequest | undefined;
  error: Error | undefined;
}