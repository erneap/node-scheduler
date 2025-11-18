export interface IPeriod {
  month: Date;
  periods?: Date[];
}

export class Period implements IPeriod {
  public month: Date;
  public periods: Date[];

  constructor(per?: IPeriod) {
    this.month = (per) ? new Date(per.month) : new Date(0);
    this.periods = [];
    if (per && per.periods && per.periods.length > 0) {
      per.periods.forEach(p => {
        this.periods.push(new Date(p));
      });
      per.periods.sort((a,b) => (a.getTime() < b.getTime()) ? -1 : 1);
    }
  }

  compareTo(other?: Period): number {
    if (other) {
      return (this.month.getTime() < other.month.getTime()) ? -1 : 1;
    }
    return -1;
  }

  sortSubperiods() {
    this.periods.sort((a,b) => (a.getTime() < b.getTime()) ? -1 : 1);
  }
}