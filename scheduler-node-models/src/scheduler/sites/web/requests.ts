export interface SiteUpdate {
  team: string;
  site: string;
  field: string;
  value: string;
}

export interface NewSite {
  teamid: string;
  id: string;
  name: string;
  utcoffset: number;
  showMids: boolean;
}

export interface NewSiteWorkcenter {
  teamid: string;
  siteid: string;
  id: string;
  name: string;
}

export interface WorkcenterUpdate {
  teamid: string;
  siteid: string;
  workcenterid: string;
  shiftPosid?: string;
  shiftPos?: string;
  field: string;
  value: string;
}

export interface NewWorkcenterSftPos {
  teamid: string;
  siteid: string;
  workcenterid: string;
  shiftPos: string;
  id: string;
  name: string;
}