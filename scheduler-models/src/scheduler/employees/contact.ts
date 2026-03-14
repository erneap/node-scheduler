/**
 * A contact record provides a reference to a list of possible contact types and 
 * a string value to be used
 */

/**
 * This interface defines a contact reference between the team contact type list and
 * the employee's information
 */
export interface IContact {
  id: number;
  typeid: number;
  sort: number;
  value: string;
}

/**
 * This class defines a contact reference.  The data members are:
 * id (a numeric value for the identifier to this reference)
 * typeid (a numeric value for the reference to the team's contact type list)
 * sort (a numeric value for sorting this contact with another)
 * value (a string value for the contact information for the employee)
 */
export class Contact implements IContact {
  public id: number;
  public typeid: number;
  public sort: number;
  public value: string;

  constructor(ct?: IContact) {
    this.id = (ct) ? ct.id : 0;
    this.typeid = (ct) ? ct.typeid : 0;
    this.sort = (ct) ? ct.sort : 0;
    this.value = (ct) ? ct.value : '';
  }

  /**
   * This function is used to sort this contact reference to another.  It uses the sort
   * value in sorting.
   * @param other A contact object used in the comparison
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before, 1 for after or 0 for equal.
   */
  compareTo(other?: Contact): number {
    if (other) {
      return (this.sort < other.sort) ? -1 : 1;
    }
    return -1;
  }
}