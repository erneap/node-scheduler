export class WeekPeriod {
  start: Date = new Date(0);
  end: Date = new Date(0);

  constructor(other?: WeekPeriod) {
    this.start = (other) ? new Date(other.start) : new Date(0);
    this.end = (other) ? new Date(other.end) : new Date(0);
  }

  compareTo(other?: WeekPeriod): number {
    if (other) {
      return (this.start.getTime() < other.start.getTime()) ? -1 : 1;
    }
    return 0;
  }
}

export class MonthPeriod {
  month: Date = new Date(0);
  weeks: WeekPeriod[] = [];
  expand: boolean = false;

  constructor(month?: MonthPeriod) {
    this.month = (month) ? new Date(month.month) : new Date(0);
    this.expand = (month) ? month.expand : false;
    this.weeks = [];
    if (month && month.weeks) {
      month.weeks.forEach(pd => {
        this.weeks.push(new WeekPeriod(pd));
      });
      this.weeks.sort((a,b) => b.compareTo(a))
    }
  }

  compareTo(other?: MonthPeriod): number {
    if (other) {
      return (this.month.getTime() < other.month.getTime()) ? -1 : 1;
    }
    return 0;
  }

  startDate(): Date {
    if (this.weeks.length > 0) {
      return new Date(this.weeks[this.weeks.length - 1].start);
    }
    return new Date(this.month);
  }

  endDate(): Date {
    if (this.weeks.length > 0) {
      return new Date(this.weeks[0].end)
    }
    return this.month;
  }
}