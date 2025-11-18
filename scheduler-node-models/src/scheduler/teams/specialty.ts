/**
 * This interface defines the data members for a specialty
 */
export interface ISpecialty {
  id: number;
  name: string;
  sort: number;
}

/**
 * This class defines the implementation of the specialty infterface plus action.
 */
export class Specialty implements ISpecialty {
  public id: number;
  public name: string;
  public sort: number;

  constructor(sp?: ISpecialty) {
    this.id = (sp) ? sp.id : 0;
    this.sort = (sp) ? sp.sort : 0;
    this.name = (sp) ? sp.name : '';
  }

  compareTo(other?: Specialty): number {
    if (other) {
      return (this.sort < other.sort) ? -1 : 1;
    }
    return -1;
  }
}