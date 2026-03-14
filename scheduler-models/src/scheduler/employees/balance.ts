/**
 * Leave balance is used to keep track of the number of hours of ordinary leave (PTO or
 * vacation) remains in an employee's year.
 */

/**
 * This interface describes a Leave balance of annual hours and number of hours to carry
 * from previous year to next.
 */
export interface IAnnualLeave {
  year: number;
  annual: number;
  carryover: number;
}

/**
 * This class describes an annual leave and carry hours.  The data members are:
 * year (the numeric value for the year it represents)
 * annual (the numeric value (float) for the number of hours the employee earns in a full
 * year).
 * carryover (the numeric value (float) for the number of hours the employee didn't use
 * in the previous year and carried forward to this year)
 */
export class AnnualLeave implements IAnnualLeave {
  public year: number;
  public annual: number;
  public carryover: number;

  constructor(anLeave?: IAnnualLeave) {
    this.year = (anLeave) ? anLeave.year : (new Date()).getUTCFullYear();
    this.annual = (anLeave) ? anLeave.annual : 0.0;
    this.carryover = (anLeave) ? anLeave.carryover : 0.0;
  }

  /**
   * This function is used in sorting between this balance and another.  It is based on
   * the year.
   * @param other The balance object to be used in comparison
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before or 1 for after.
   */
  compareTo(other?: AnnualLeave): number {
    if (other) {
      return (this.year < other.year) ? -1 : 1;
    }
    return -1;
  }
}