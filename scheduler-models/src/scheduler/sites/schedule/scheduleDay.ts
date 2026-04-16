export interface IScheduleDay {
  id: number;
  date?: Date;
  code: string;
  hours?: number;
}

export class ScheduleDay implements IScheduleDay {
  public id: number;
  public date: Date;
  public code: string;
  public hours: number;

  constructor(day?: IScheduleDay) {
    this.id = (day) ? day.id : 0;
    this.code = (day) ? day.code : '';
    this.hours = (day && day.hours) ? day.hours : 0;
    this.date = (day && day.date) ? new Date(day.date) : new Date();
  }

  compareTo(other?: ScheduleDay): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return 0;
  }
}