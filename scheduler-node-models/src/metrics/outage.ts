import { ObjectId } from "mongodb";

/**
 * This interface defines the data members associated with a ground outage
 */
export interface IOutage {
  _id?: ObjectId;
  id?: string;
  outageDate: Date;
  groundSystem: string;
  classification: string;
  outageNumber: number;
  outageMinutes: number;
  subSystem: string;
  referenceId: string;
  majorSystem: string;
  problem: string;
  fixAction: string;
  missionOutage: boolean;
  capability?: string;
}

export class Outage implements IOutage {
  public id: string;
  public outageDate: Date;
  public groundSystem: string;
  public classification: string;
  public outageNumber: number;
  public outageMinutes: number;
  public subSystem: string;
  public referenceId: string;
  public majorSystem: string;
  public problem: string;
  public fixAction: string;
  public missionOutage: boolean;
  public capability?: string;

  constructor(outage?: IOutage) {
    this.id = (outage && outage.id) ? outage.id : '';
    if (this.id === '') {
      this.id = (outage && outage._id) ? outage?._id?.toString() : '';
    }
    this.outageDate = (outage) ? new Date(outage.outageDate) : new Date();
    this.groundSystem = (outage) ? outage.groundSystem : '';
    this.classification = (outage) ? outage.classification : '';
    this.outageNumber = (outage) ? outage.outageNumber : 0;
    this.outageMinutes = (outage) ? outage.outageMinutes : 0;
    this.subSystem = (outage) ? outage.subSystem : '';
    this.referenceId = (outage) ? outage.referenceId : '';
    this.majorSystem = (outage) ? outage.majorSystem : '';
    this.problem = (outage) ? outage.problem : '';
    this.fixAction = (outage) ? outage.fixAction : '';
    this.missionOutage = (outage) ? outage.missionOutage : false;
    this.capability = (outage && outage.capability) ? outage.capability : undefined;
  }

  /**
   * This function is used in sorting outages by comparing the outage's dates and numbers.
   * @param other Another outage object used for comparison
   * @returns A numeric value for the relative position of this object to the other.
   */
  compareTo(other?: Outage): number {
    if (other) {
      if (this.outageDate.getTime() === other.outageDate.getTime()) {
        return (this.outageNumber < other.outageNumber) ? -1 : 1;
      }
      return (this.outageDate.getTime() < other.outageDate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  useOutage(start: Date, end: Date): boolean {
    return (start.getTime() <= this.outageDate.getTime() 
      && end.getTime() > this.outageDate.getTime());
  }
}