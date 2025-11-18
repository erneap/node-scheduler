import { ObjectId } from "mongodb";

/**
 * Work interface and class descriptions
 */

/**
 * The work interface describing the data members required.
 */
export interface IWork {
  dateworked: Date;
  chargenumber: string;
  extension: string;
  paycode: number;
  modtime?: boolean;
  hours: number;
}

/**
 * This class description for a work object. The data members are:
 * date worked (date object for the date the work record),
 * charge number (string value for the labor code's charge number),
 * extension (string value for the labor code's extension),
 * paycode (numeric value for the pay code used by the company),
 * modtime (boolean value to indicate if the recorded information is for modified time),
 * hours (numeric value for the number of hours worked for the labor code)
 */
export class Work implements IWork {
  public dateworked: Date;
  public chargenumber: string;
  public extension: string;
  public paycode: number;
  public modtime: boolean;
  public hours: number;

  constructor(wk?: IWork) {
    this.dateworked = (wk) ? new Date(wk.dateworked) : new Date(0);
    this.chargenumber = (wk) ? wk.chargenumber : '';
    this.extension = (wk) ? wk.extension : '';
    this.paycode = (wk) ? wk.paycode : 1;
    this.modtime = (wk && wk.modtime) ? wk.modtime : false;
    this.hours = (wk) ? wk.hours : 0.0;
  }

  /**
   * This function is used in sorting work objects.  Based on date worked and the labor
   * code.
   * @param other The work object to use in comparison
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before or 1 for after.
   */
  compareTo(other?: Work): number {
    if (other) {
      if (this.dateworked.getTime() === other.dateworked.getTime()) {
        if (this.chargenumber === other.chargenumber) {
          return this.extension < other.extension ? -1 : 1;
        }
        return this.chargenumber < other.chargenumber ? -1 : 1;
      }
      return this.dateworked.getTime() < other.dateworked.getTime() ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function is used to compare this object's date worked with a date provided.
   * @param date A date object used for comparison.
   * @returns A boolean value to indicate whether the work object is on the date provided.
   */
  useWork(date: Date): boolean {
    return this.dateworked.getUTCFullYear() === date.getUTCFullYear()
      && this.dateworked.getUTCMonth() === date.getUTCMonth()
      && this.dateworked.getUTCDate() === date.getUTCDate();
  }
}

/**
 * The interface and class for holding work objects for an employee and year.
 */

/**
 * This interface describes the data members of a Work Record.
 */
export interface IWorkRecord {
  _id?: ObjectId;
  id?: string;
  employeeID?: ObjectId;
  empID?: string;
  year: number;
  work?: IWork[];
}

/**
 * This class description for the employee's yearly work record.  The data members are:
 * id (string value representing the database's _id value - primary key)
 * empID (string value for the associated employee's identifier)
 * year (numeric value for the year associated with the work records)
 * work (an array of work objects containing all the actual work performed)
 */
export class WorkRecord implements IWorkRecord {
  public id: string;
  public empID: string;
  public year: number;
  public work: Work[];

  constructor(wr?: IWorkRecord) {
    this.id = (wr && wr.id) ? wr.id : '';
    if (this.id === '') {
      this.id = (wr && wr._id) ? wr._id.toString() : '';
    }
    this.empID = (wr && wr.empID) ? wr.empID : '';
    if (this.empID === '') {
      this.empID = (wr && wr.employeeID) ? wr.employeeID.toString() : '';
    }
    this.year = (wr) ? wr.year : (new Date()).getFullYear();
    this.work = [];
    if (wr && wr.work && wr.work.length > 0) {
      wr.work.forEach(wk => {
        this.work.push(new Work(wk));
      });
      this.work.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function is used in sorting these annual work records.  Based on employee 
   * identifier and year.
   * @param other The annual work record used for comparison.
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before or 1 for after.
   */
  compareTo(other?: WorkRecord) : number {
    if (other) {
      if (this.empID === other.empID) {
        return (this.year < other.year) ? -1 : 1;
      }
      return (this.empID < other.empID) ? -1 : 1
    }
    return -1;
  }

  /**
   * This function will remove work objects from this object's work array based on the
   * period defined by the start and end dates.
   * @param start The date object for the start of the removal period
   * @param end The date object for the end of the removal period
   */
  removeWork(start: Date, end: Date) {
    for (let w=this.work.length - 1; w >= 0; w--) {
      if (this.work[w].dateworked.getTime() >= start.getTime()
        && this.work[w].dateworked.getTime() <= end.getTime()) {
        this.work.splice(w, 1);
      }
    }
  }

  /**
   * This function will remove work objects from this object's work array
   * @param purgeDate The date object to remove all data before it.
   * @returns A boolean value to indicate whether or not the work array is empty.
   */
  purge(purgeDate: Date): boolean {
    for (let w=this.work.length - 1; w >= 0; w--) {
      if (this.work[w].dateworked.getTime() < purgeDate.getTime()) {
        this.work.splice(w, 1);
      }
    }
    return this.work.length === 0;
  }
}