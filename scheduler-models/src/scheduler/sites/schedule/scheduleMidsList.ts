export interface IMidListItem {
  name: string;
  start: Date;
  end: Date;
}

export class MidListItem implements IMidListItem {
  public name: string;
  public start: Date;
  public end: Date;

  constructor(other?: IMidListItem) {
    this.name = (other) ? other.name : '';
    this.start = (other) ? new Date(other.start) : new Date(0);
    this.end = (other) ? new Date(other.end) : new Date(0);
  }

  compareTo(other?: MidListItem): number {
    if (other) {
      if (this.start.getTime() === other.start.getTime()) {
        if (this.end.getTime() === other.end.getTime()) {
          return (this.name < other.name) ? -1 : 1;
        }
        return (this.end.getTime() < other.end.getTime()) ? -1 : 1;
      }
      return (this.start.getTime() < other.start.getTime()) ? -1 : 1;
    }
    return -1;
  }
}