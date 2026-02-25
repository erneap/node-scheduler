export interface NewTeam {
  id: string;
  name: string;
}

export interface NewCompany {
  id: string;
  name: string;
  ingest: string;
  ingestPeriod?: number;
  startDay?: number;
}