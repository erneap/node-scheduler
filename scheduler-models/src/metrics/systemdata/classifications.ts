/**
 * This interface defines the data members of a classification object.
 */
export interface IClassification {
  id: string;
  title: string;
  sortID: number;
}

/**
 * This class defines the data members and actions for a classification object.
 */
export class Classification implements IClassification {
  public id: string;
  public title: string;
  public sortID: number;

  constructor(cl?: IClassification) {
    this.id = (cl) ? cl.id : '';
    this.title = (cl) ? cl.title : '';
    this.sortID = (cl) ? cl.sortID : 0;
  }

  compareTo(other?: Classification): number {
    if (other) {
      return (this.sortID < other.sortID) ? -1 : 1;
    }
    return -1;
  }
}