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

export interface ReportRequest {
  reportType: string;
  period?: string;
  subreport?: string;
  teamid?: string;
  siteid?: string;
  companyid?: string;
  password?: string;
  startDate?: string;
  endDate?: string;
  userid?: string;
  includeDaily: boolean;
}