/**
 * This interface and class is for recording the employee's work specialities or the 
 * skills they have from the team's specialty list.
 */

/**
 * This interface is used to describe a user's specialties.
 */
export interface ISpecialty {
  id: number;
  specialtyid: number;
  sort: number;
  qualified: boolean;
}

/**
 * This class is used to describe the relationship of the employee's specialties to the
 * team's specialties list.  The data members are:
 * id (numeric value for the key to the relationship list)
 * specialtyid (numeric value in reference to the team's specialty list)
 * sort (numeric value used to sort the display of the specialties)
 * qualified (boolean value to show whether or not the employee is qualfied)
 */
export class Specialty implements ISpecialty {
  public id: number;
  public specialtyid: number;
  public sort: number;
  public qualified: boolean;

  constructor(sp?: ISpecialty) {
    this.id = (sp) ? sp.id : 0;
    this.specialtyid = (sp) ? sp.specialtyid : 0;
    this.sort = (sp) ? sp.sort : 0;
    this.qualified = (sp) ? sp.qualified : false;
  }

  /**
   * This function is used to sort this object from another specialty object
   * @param other The other specialty object for comparison
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before or 1 for after.
   */
  compareTo(other?: Specialty): number {
    if (other) {
      return this.sort < other.sort ? -1 : 1;
    }
    return -1;
  }
}