import { IWorkday, Workday } from "scheduler-models/scheduler/employees";

export class WorkWeek {
  public week: Workday[];
  public id: number = 0

  constructor(id: number) {
    this.id = id;
    this.week = [];
    for (let i=0; i < 7; i++) {
      const wd: Workday = new Workday();
      wd.date = undefined;
      wd.id = i;
      this.week.push(wd);
    }
  }

  setWorkday(wd: IWorkday, date?: Date) {
    const wDay = new Workday(wd);
    if (date) {
      wDay.date = new Date(date);
    }
    let day = 0;
    if (wDay.date) {
      day = wDay.date.getUTCDay();
    } else {
      day = wDay.id % 7;
    }
    this.week[day] =new Workday(wDay);
  }

  getWorkday(id: number): Workday {
    return this.week[id % 7];
  }

  getWorkdays(): Workday[] {
    this.week.sort((a,b) => a.compareTo(b));
    return this.week;
  }

  compareTo(other: WorkWeek): number {
    return (this.id < other.id) ? -1 : 1;
  }
}