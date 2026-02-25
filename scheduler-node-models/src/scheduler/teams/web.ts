import { HolidayType } from "./company";

export interface NewTeam {
  id: string;
  name: string;
}

export interface NewCompany {
  team: string;
  id: string;
  name: string;
  ingest: string;
  ingestPeriod?: number;
  startDay?: number;
  ingestPwd?: string;
}

export interface NewCompanyHoliday {
  team: string;
  company: string;
  name: string;
  holidayType: HolidayType;
  sort: number;
}

export interface NewModPeriod {
  team: string;
  companyid: string;
  year: number;
  start: Date;
  end: Date;
}

export interface NewTeamSpecialtyContact {
  team: string;
  name: string;
}

export interface UpdateTeam {
  team: string;
  companyid?: string;
  optid?: string;
  field: string;
  value: string;
}