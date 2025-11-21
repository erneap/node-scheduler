export interface IModWeek {
  start?: Date;
  end?: Date;
}

export class ModWeek implements IModWeek {
  public start: Date;
  public end: Date;

  constructor(iprd?: IModWeek) {
    this.start = (iprd && iprd.start) ? new Date(iprd.start) : new Date();
    this.end = (iprd && iprd.end) ? new Date(iprd.end) : new Date(); 
  }

  label(): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit'
    });
    return formatter.format(this.end);
  }

  compareTo(other?: ModWeek): number {
    if (other) {
      if (other.start.getTime() < this.start.getTime()) {
        return 1;
      }
    }
    return -1;
  }
}

export interface IModMonth {
  month: Date;
  weeks: IModWeek[];
}

export class ModMonth implements IModMonth {
  public month: Date;
  public weeks: ModWeek[];

  constructor(month?: IModMonth) {
    this.weeks = [];
    if (month) {
      this.month = new Date(month.month);
      month.weeks.forEach(wk => {
        this.weeks.push(new ModWeek(wk));
      });
    } else {
      const nMonth = new Date();
      this.month = new Date(Date.UTC(nMonth.getFullYear(), nMonth.getMonth(), 1));
    }
    this.weeks.sort((a,b) => a.compareTo(b));
  }

  label(): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: '2-digit'
    });
    return formatter.format(this.month);
  }

  compareTo(other?: ModMonth): number {
    if (other) {
      if (other.month.getTime() < this.month.getTime()) {
        return 1;
      }
    }
    return -1;
  }
}