/**
 * The leave record is used for approved and actual leave (non-work) time.
 */

/**
 * This interface is used to describe a leave day, either approved or actual leave.
 */
export interface ILeave {
  id: number;
  leavedate: Date;
  code: string;
  hours: number;
  status: string;
  requestid: string;
  used: boolean;
  tagday?: string;
}

/**
 * This class describes a leave day.  Its data member are:
 * id (numeric value for the key to the leaves listed)
 * leavedate (the date object for the date the leave is on)
 * code (the string value for the leave code to be used)
 * hours (the numeric value (float) for the number of hours used or projected to be used)
 * status (the string value for the status of the leave, either approved or actual)
 * requestid (the string value representing the id of the request used to get this leave
 * approved)
 * used (a boolean value used by the application as whether or not the leave was used
 * already)
 * tagday (a string value for a tag to a holiday type leave to ensure it fills a 
 * particular holiday in the company's holiday list)
 */
export class Leave implements ILeave {
  public id: number;
  public leavedate: Date;
  public code: string;
  public hours: number;
  public status: string;
  public requestid: string;
  public used: boolean;
  public tagday?: string;

  constructor(other?: ILeave) {
    this.id = (other) ? other.id : 0;
    this.leavedate = (other) ? new Date(other.leavedate) : new Date(0);
    this.code = (other) ? other.code : 'V';
    this.hours = (other) ? other.hours : 0.0;
    this.status = (other) ? other.status : 'REQUESTED';
    this.requestid = (other) ? other.requestid : '';
    this.used = (other) ? other.used : false;
    this.tagday = (other && other.tagday) ? other.tagday : undefined;
  }

  /**
   * This function is used in sorting between this leave and another.  It is based on
   * the leave date, hours used/proposed, and code used.
   * @param other The leave object to be used in comparison
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before or 1 for after.
   */
  compareTo(other?: Leave): number {
    if (other) {
      if (this.leavedate.getTime() === other.leavedate.getTime()) {
        if (this.hours === other.hours) {
          return (this.code < other.code) ? -1 : 1;
        }
        return (this.hours > other.hours) ? -1 : 1;
      }
      return (this.leavedate.getTime() < other.leavedate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function will provide a boolean value for whether or not this leave is on the
   * requested date.  The leave date and provided date are compared using UTC value of 
   * year, month, and day
   * @param date The date object used for comparision
   * @returns The boolean value stating whether the UTC value for year, month and day are
   * equal.
   */
  useLeave(date: Date): boolean {
    return (this.leavedate.getUTCFullYear() === date.getUTCFullYear()
      && this.leavedate.getUTCMonth() === date.getUTCMonth() 
      && this.leavedate.getUTCDate() === date.getUTCDate());
  }
}