/**
 * Employee Labor Code is specifically designed to hold the codes used by companies'
 * payroll system to record time spent on a particular function.  This will normally
 * consist of a base charge number and an extension code.
 */

/**
 * This interface will be used to assign an employee a labor code.
 */
export interface IEmployeeLaborCode {
  chargenumber: string;
  extension: string;
}

/**
 * This class defined an employee's labor code.  The data members are:
 * chargeNumber (string value for a general work area).
 * extension (string value to entend the charge number to specific work assignments)
 */
export class EmployeeLaborCode implements IEmployeeLaborCode {
  public chargenumber: string;
  public extension: string;

  constructor(elc?: IEmployeeLaborCode) {
    this.chargenumber = (elc) ? elc.chargenumber : '';
    this.extension = (elc) ? elc.extension : '';
  }

  /**
   * This function will provide a numeric value for whether or not this employee labor
   * code is before or after another object.  The charge number and extension are used
   * for comparison
   * @param other The employee labor code object used for comparision
   * @returns A numeric value to indicate whether this object is before or after another
   * employee labor code.  -1 is before and 1 is after.
   */
  compareTo(other?: EmployeeLaborCode): number {
    if (other) {
      if (this.chargenumber === other.chargenumber) {
        return (this.extension < other.extension) ? -1 : 1;
      }
      return (this.chargenumber < other.chargenumber) ? -1 : 1;
    }
    return -1;
  }
}