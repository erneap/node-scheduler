import { IScheduleEmployee, ScheduleEmployee } from "./scheduleEmployee";

export interface IScheduleWorkcenter {
  id: number;
  name: string;
  employees: IScheduleEmployee[];
}

export class ScheduleWorkcenter {
  public id: number;
  public name: string;
  public employees: ScheduleEmployee[];

  constructor(wc?: IScheduleWorkcenter) {
    this.id = (wc) ? wc.id : 0;
    this.name = (wc) ? wc.name : '';
    this.employees = [];
    if (wc && wc.employees.length > 0) {
      wc.employees.forEach(emp => {
        this.employees.push(new ScheduleEmployee(emp));
      });
      this.employees.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: ScheduleWorkcenter): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return 0;
  }
}