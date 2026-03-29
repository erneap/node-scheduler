export interface IScheduleShiftCount {
  day: number;
  count: number;
}

export class ScheduleShiftCount implements IScheduleShiftCount {
  public day: number;
  public count: number;

  constructor(c?: IScheduleShiftCount) {
    this.day = (c) ? c.day : 0;
    this.count = (c) ? c.count : 0;
  }

  compareTo(other?: ScheduleShiftCount): number {
    if (other) {
      return (this.day < other.day) ? -1 : 1;
    }
    return 0;
  }

  increment() {
    this.count++;
  }
}