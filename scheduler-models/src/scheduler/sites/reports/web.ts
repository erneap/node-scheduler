export interface NewSiteForecast {
  team: string;
  site: string;
  name: string;
  start: Date;
  end: Date;
  company: string;
  period: number;
  sortFirst: boolean;
}

export interface UpdateSiteForecast {
  team: string;
  site: string;
  forecast: number;
  field: string;
  value: string;
}

export interface NewSiteForecastChargeNumber {
  team: string;
  site: string;
  forecast: number;
  chargeNumber: string;
  extension: string;
  location?: string;
  minimum: number;
  vacantName: string;
  hoursPerEmployee: number;
  exercise: boolean;
  clin?: string;
  slin?: string;
  wbs?: string;
  start?: Date;
  end?: Date;
}

export interface UpdateSiteForecastChargeNumber {
  team: string;
  site: string;
  forecast: number;
  chargeNumber: string;
  extension: string;
  field: string;
  value: string;
}

export interface NewSiteCofSReport {
  team: string;
  site: string;
  name: string;
  shortname: string;
  unit: string;
  start: Date;
  end: Date;
}

export interface NewSiteCofSReportSection {
  team: string;
  site: string;
  reportid: number;
  label: string;
  company: string;
  signature: string;
  showunit: boolean;
}

export interface UpdateSiteCofSReport {
  team: string;
  site: string;
  reportid: number;
  sectionid: number;
  field: string;
  value: string;
}