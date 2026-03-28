import { IScheduleDay, ScheduleDay } from "./scheduleDay";

export interface IScheduleEmployee {
  id: number;
  name: string;
  days: IScheduleDay[];
}

export class ScheduleEmployee implements IScheduleEmployee {
  public id: number;
  public name: string;
  public days: ScheduleDay[];

  constructor(emp?: IScheduleEmployee) {
    this.id = (emp) ? emp.id : 0;
    this.name = (emp) ? emp.name : '';
    this.days = [];
    if (emp && emp.days.length > 0) {
      emp.days.forEach(day => {
        this.days.push(new ScheduleDay(day));
      });
      this.days.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: ScheduleEmployee): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return 0;
  }
}