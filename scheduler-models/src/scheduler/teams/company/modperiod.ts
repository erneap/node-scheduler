/**
 * This interface defines a company's modified work period for pay recording.  The 
 * modified work period is to ensure employee's can't carry over modified time from one
 * fiscal period to another, so it has definitive start and ending dates.
 */
export interface IModPeriod {
  year: number;
  start: Date;
  end: Date;
}

/**
 * This class defines the implementation of the company's modified work period, plus an
 * action to sort the periods with.
 */
export class ModPeriod implements IModPeriod{
  public year: number;
  public start: Date;
  public end: Date;

  constructor(mod?: IModPeriod) {
    this.year = (mod) ? mod.year : 0;
    this.start = (mod) ? new Date(mod.start) : new Date(0);
    this.end = (mod) ? new Date(mod.end) : new Date(0);
  }

  compareTo(other?: ModPeriod): number {
    if (other) {
      return (this.year < other.year) ? -1 : 1;
    }
    return -1;
  }
}