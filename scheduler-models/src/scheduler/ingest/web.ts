import { IWork, ILeave } from "../employees";

export interface IngestChanges {
  employee: string;
  changetype: string;
  work: IWork;
  leave: ILeave;
}

export interface ManualIngestChanges {
  team: string;
  site: string;
  company: string;
  changes: IngestChanges[];
}