/**
 * This interface is used to list a Distributed Common Ground Station site and the
 * types of exploitation done at that site.
 */
export interface IDCGS {
  id: string;
  exploitations?: string[];
  sortID: number;
}

/**
 * This class implements the DCGS interface plus actions
 */
export class DCGS implements IDCGS {
  public id: string;
  public exploitations?: string[] | undefined;
  public sortID: number;

  constructor(d?: IDCGS) {
    this.id = (d) ? d.id : '';
    this.sortID = (d) ? d.sortID : 0;
    if (d && d.exploitations) {
      this.exploitations = [];
      d.exploitations.forEach(ex => {
        this.exploitations?.push(ex);
      });
      this.exploitations.sort();
    }
  }

  compareTo(other?: DCGS): number {
    if (other) {
      return (this.sortID < other.sortID) ? -1 : 1;
    }
    return -1;
  }
}