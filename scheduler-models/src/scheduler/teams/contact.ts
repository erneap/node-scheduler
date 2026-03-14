/**
 * This interface defines the data members for a contact type.
 */
export interface IContact {
  id: number;
  name: string;
  sort: number;
}

/**
 * this class defines the implementation of the contact type plus actions
 */
export class Contact implements IContact {
  public id: number;
  public name: string;
  public sort: number;

  constructor(co?: IContact) {
    this.id = (co) ? co.id : 0;
    this.name = (co) ? co.name : '';
    this.sort = (co) ? co.sort : 0;
  }

  compareTo(other?: Contact): number {
    if (other) {
      return (this.sort < other.sort) ? -1 : 1;
    }
    return -1;
  }
}