export interface ILaborCode {
  chargeNumber: string;
  extension: string;
  clin?: string;
  slin?: string;
  location?: string;
  wbs?: string;
  minimumEmployees?: number;
  notAssignedName?: string;
  hoursPerEmployee?: number;
  exercise?: boolean;
  startDate?: Date;
  endDate?: Date;
  sort?: number;
}

export class LaborCode implements ILaborCode {
  public chargeNumber: string;
  public extension: string;
  public clin?: string;
  public slin?: string;
  public location?: string;
  public wbs?: string;
  public minimumEmployees?: number;
  public notAssignedName?: string;
  public hoursPerEmployee?: number;
  public exercise?: boolean;
  public startDate?: Date;
  public endDate?: Date;
  public sort: number;

  constructor(lc?: ILaborCode) {
    this.chargeNumber = (lc) ? lc.chargeNumber : '';
    this.extension = (lc) ? lc.extension : '';
    this.clin = (lc && lc.clin) ? lc.clin : undefined;
    this.slin = (lc && lc.slin) ? lc.slin : undefined;
    this.location = (lc && lc.location) ? lc.location : undefined;
    this.wbs = (lc && lc.wbs) ? lc.wbs : undefined;
    this.minimumEmployees = (lc && lc.minimumEmployees) ? lc.minimumEmployees : undefined;
    this.notAssignedName = (lc && lc.notAssignedName) ? lc.notAssignedName : undefined;
    this.hoursPerEmployee = (lc && lc.hoursPerEmployee) ? lc.hoursPerEmployee : undefined;
    this.exercise = (lc && lc.exercise) ? lc.exercise : undefined;
    this.startDate = (lc && lc.startDate) ? lc.startDate : undefined;
    this.endDate = (lc && lc.endDate) ? lc.endDate : undefined;
    this.sort = (lc && lc.sort) ? lc.sort : 0;
  }

  compareTo(other?: LaborCode) {
    if (other) {
      if (this.sort === other.sort) {
        if (this.chargeNumber.toLowerCase() === other.chargeNumber.toLowerCase()) {
          return (this.extension.toLowerCase() < other.extension.toLowerCase()) ? -1 : 1;
        }
        return (this.chargeNumber.toLowerCase() < other.chargeNumber.toLowerCase()) ? -1 : 1;
      }
      return (this.sort < other.sort) ? -1 : 1;
    }
    return -1;
  }

  inTimePeriod(start: Date, end: Date): boolean {
    if (this.startDate && this.endDate) {
      return ((start.getTime() >= this.startDate.getTime() 
        && start.getTime() <= this.endDate.getTime())
        || (end.getTime() >= this.startDate.getTime()
        && end.getTime() <= this.endDate.getTime()));
    }
    return true;
  }
}