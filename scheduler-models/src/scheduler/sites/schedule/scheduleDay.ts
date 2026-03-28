export interface IScheduleDay {
  id: number;
  code: string;
}

export class ScheduleDay implements IScheduleDay {
  public id: number;
  public code: string;

  constructor(day?: IScheduleDay) {
    this.id = (day) ? day.id : 0;
    this.code = (day) ? day.code : '';
  }

  compareTo(other?: ScheduleDay): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return 0;
  }
}