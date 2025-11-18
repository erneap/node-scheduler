import { ObjectId } from "mongodb";
import { IMissionSensor, MissionSensor } from "./missionsensor";

/**
 * This interfcae defines the data members for a mission.
 */
export interface IMission {
  _id?: ObjectId;
  id?: string;
  missionDate: Date;
  platformID: string;
  sortieID: number;
  exploitation: string;
  tailNumber: string;
  communications: string;
  primaryDCGS: string;
  cancelled: boolean;
  executed?: boolean;
  aborted: boolean;
  indefDelay: boolean;
  missionOverlap: number;
  comments: string;
  sensors?: IMissionSensor[];
}

/**
 * This class implements the mission interface data members plus actions.
 */
export class Mission implements IMission {
  public id: string;
  public missionDate: Date;
  public platformID: string;
  public sortieID: number;
  public exploitation: string;
  public tailNumber: string;
  public communications: string;
  public primaryDCGS: string;
  public cancelled: boolean;
  public executed: boolean;
  public aborted: boolean;
  public indefDelay: boolean;
  public missionOverlap: number;
  public comments: string;
  public sensors: MissionSensor[];

  constructor(msn?: IMission) {
    this.id = (msn && msn.id) ? msn.id : '';
    if (this.id === '') {
      this.id = (msn && msn._id) ? msn._id.toString() : '';
    }
    this.missionDate = (msn) ? new Date(msn.missionDate) : new Date(0);
    this.platformID = (msn) ? msn.platformID : '';
    this.sortieID = (msn) ? msn.sortieID : 0;
    this.exploitation = (msn) ? msn.exploitation : 'PRIMARY';
    this.tailNumber = (msn) ? msn.tailNumber : 'A';
    this.communications = (msn) ? msn.communications : 'LOS';
    this.primaryDCGS = (msn) ? msn.primaryDCGS : 'C';
    this.cancelled = (msn) ? msn.cancelled : false;
    this.executed = (msn && msn.executed) ? msn.executed : false;
    this.aborted = (msn) ? msn.aborted : false;
    this.indefDelay = (msn) ? msn.indefDelay : false;
    this.missionOverlap = (msn) ? msn.missionOverlap : 0;
    this.comments = (msn) ? msn.comments : '';
    this.sensors = [];
    if (msn && msn.sensors && msn.sensors.length > 0) {
      msn.sensors.forEach(sen => {
        this.sensors.push(new MissionSensor(sen));
      });
      this.sensors.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: Mission): number {
    if (other) {
      if (this.missionDate.getTime() === other.missionDate.getTime()) {
        if (this.platformID.toLowerCase() === other.platformID.toLowerCase()) {
          return (this.sortieID < other.sortieID) ? -1 : 1;
        }
        return (this.platformID.toLowerCase() < other.platformID.toLowerCase()) ? -1 : 1;
      }
      return (this.missionDate.getTime() < other.missionDate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  equipmentInUse(sid: string): boolean {
    let answer = false;
    if (this.sensors.length > 0) {
      this.sensors.forEach(sen => {
        if (sen.equipmentInUse(sid)) {
          answer = true;
        }
      });
    } else {
      answer = true;
    }
    return answer;
  }

  useMission(start: Date, end: Date): boolean {
    return (this.missionDate.getTime() >= start.getTime() 
      && this.missionDate.getTime() < end.getTime());
  }
}