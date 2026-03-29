import { IScheduleShiftCount, ScheduleShiftCount } from "./scheduleShiftCount";

export interface IScheduleShift {
  id: number;
  name: string;
  codes: string[];
  minimums: number;
  counts: IScheduleShiftCount[];
}

export class ScheduleShift implements IScheduleShift {
  public id: number;
  public name: string;
  public codes: string[];
  public minimums: number;
  public counts: ScheduleShiftCount[];

  constructor(shft?: IScheduleShift) {
    this.id = (shft) ? shft.id : 0;
    this.name = (shft) ? shft.name : '';
    this.minimums = (shft) ? shft.minimums : 0;
    this.codes = [];
    if (shft) {
      shft.codes.forEach(cd => {
        this.codes.push(cd);
      });
    }
    this.counts = [];
    if (shft) {
      shft.counts.forEach(count => {
        this.counts.push(new ScheduleShiftCount(count));
      });
      this.counts.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: ScheduleShift): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return 0;
  }

  /**
   * This method will create a count object for each day of a month.
   * @param date The Date object to define the start of the month.
   */
  setCounts(date: Date) {
    this.counts = [];
    let start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1 ));
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
    while (start.getTime() < end.getTime()) {
      const newCount = new ScheduleShiftCount({
        day: start.getUTCDate(),
        count: 0
      });
      this.counts.push(newCount);
      start = new Date(start.getTime() + (24 * 3600000));
    }
    this.counts.sort((a,b) => a.compareTo(b));
  }

  addDayCount(code: string, date: Date): boolean {
    let found = false;
    this.codes.forEach(cd => {
      if (cd.toLowerCase() === code.toLowerCase()) {
        found = true;
      }
    });
    if (found) {
      this.counts.forEach(count => {
        if (count.day === date.getUTCDate()) {
          count.increment();
        }
      });
    }
    return found;
  }

  meetsMinimums(date: Date): boolean {
    if (this.counts.length > date.getUTCDate()) {
      return this.counts[date.getUTCDate()].count > this.minimums;
    }
    return false;
  }
}