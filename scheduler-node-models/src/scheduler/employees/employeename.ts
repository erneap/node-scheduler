/**
 * Employee Name interface and class will be used to store and manipulate an employee's
 * name.
 */

/**
 * This interface is used to describe an employee's name.
 */
export interface IEmployeeName {
  firstname: string;
  middlename?: string;
  lastname: string;
  suffix?: string;
}

/**
 * This class defined an employee name.  The data members are:
 * first, middlename and lastname names, plus an optional name suffix (ie. Jr, II, ...)
 */
export class EmployeeName implements IEmployeeName {
  public firstname: string;
  public middlename?: string;
  public lastname: string;
  public suffix?: string;

  constructor(name?: IEmployeeName) {
    this.firstname = (name) ? name.firstname : '';
    this.middlename = (name && name.middlename) ? name.middlename : undefined;
    this.lastname = (name) ? name.lastname : '';
    this.suffix = (name) ? name.suffix : undefined; 
  }

  /**
   * This function will provide a complete full name consisting of first and lastname or
   * first middlename and lastname names.  the optional suffix is included.
   * @returns The string value for the employee's full name (first middlename lastname suffix)
   */
  getFullName(): string {
    let result = '';
    if (!this.middlename) {
      result = this.firstname + ' ' + this.lastname;
    } else {
      result = this.firstname + ' ' + this.middlename.substring(0,1) + '. '
        + this.lastname;
    }
    if (this.suffix) {
      result += ` ${this.suffix}`;
    }
    return result;
  }

  /**
   * This function will provide a shortened full name, minus the middlename and suffix.
   * @returns A string value with the employee's shortened name (first lastname).
   */
  getFirstLast(): string {
    return this.firstname + ' ' + this.lastname;
  }

  /**
   * This function will provide a shortened full name in the form of lastname, first
   * @returns A string value for the employee's name (lastname, first)
   */
  getLastFirst(): string {
    return this.lastname + ', ' + this.firstname;
  }

  /**
   * This function is used in sorting between this name and another.  It is based on
   * the lastname, first, middlename and suffix (in order).
   * @param other The name object to be used in comparison
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before, 1 for after or 0 for equal.
   */
  compareTo(other?: EmployeeName): number {
    if (other) {
      if (this.lastname.toLowerCase() === other.lastname.toLowerCase()) {
        if (this.firstname.toLowerCase() === other.firstname.toLowerCase()) {
          if (this.middlename && other.middlename) {
            if (this.middlename.toLowerCase() === other.middlename.toLowerCase()) {
              if (this.suffix && other.suffix) {
                return (this.suffix.toLowerCase() < other.suffix.toLowerCase()) ? -1 : 1;
              } else if (this.suffix) {
                return 1;
              } else if (other.suffix) {
                return -1;
              }
              return 0;
            }
            return (this.middlename.toLowerCase() < other.middlename.toLowerCase()) ? -1 : 1;
          } else if (this.middlename) {
            return 1;
          } else if (other.middlename) {
            return -1;
          }
          return 0;
        }
        return (this.firstname.toLowerCase() < other.firstname.toLowerCase()) ? -1 : 1;
      }
      return (this.lastname.toLowerCase() < other.lastname.toLowerCase()) ? -1 : 1;
    }
    return -1;
  }
}