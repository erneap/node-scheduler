import { Leave } from "scheduler-node-models/scheduler/employees";
import { Holiday } from "scheduler-node-models/scheduler/teams/company";

export class LeavePeriod {
  public code: string;
  public start: Date;
  public end: Date;
  public status: string;
  public leaves: Leave[];

  constructor(leave?: Leave) {
    this.code = (leave) ? leave.code : '';
    this.start = (leave) ? new Date(leave.leavedate) : new Date(0);
    this.end = (leave) ? new Date(leave.leavedate) : new Date(0);
    this.status = (leave) ? leave.status : 'approved';
    this.leaves = [];
    if (leave) {
      this.leaves.push(new Leave(leave));
    }
  }

  compareTo(other?: LeavePeriod): number {
    if (other) {
      return (this.start.getTime() < other.start.getTime()) ? -1 : 1;
    }
    return -1;
  }

  getHours(type?: string, actual?: boolean): number {
    let hours = 0.0;
    if (type && type.toLowerCase() === 'v') {
      this.leaves.forEach(lv => {
        if (lv.code.toLowerCase() === 'v') {
          if (actual && lv.status.toLowerCase() === 'actual') {
            hours += lv.hours;
          } else if (!actual && lv.status.toLowerCase() !== 'actual') {
            hours += lv.hours;
          }
        }
      });
    } else {
      this.leaves.forEach(lv => {
        hours += lv.hours;
      });
    }
    return hours;
  }

  addLeave(leave: Leave) {
    this.leaves.push(new Leave(leave));
    this.end = new Date(leave.leavedate);
  }
}

export class LeaveMonth {
  public month: Date;
  public holiday?: Holiday;
  public disabled: boolean;
  public periods: LeavePeriod[];
  public standard: number;

  constructor(start: Date, std: number, disabled: boolean, holiday?: Holiday) {
    this.month = new Date(start);
    this.standard = std;
    this.disabled = disabled;
    this.periods = [];
    this.holiday = undefined;
    if (holiday) {
      this.holiday = new Holiday(holiday);
    }
  }

  compareTo(other?: LeaveMonth): number {
    if (other) {
      if (this.holiday && other.holiday) {
        if (this.holiday.id.toLowerCase() === other.holiday.id.toLowerCase()) {
          return (this.holiday.sort < other.holiday.sort) ? -1 : 1;
        }
        return (this.holiday.id.toLowerCase() === 'h') ? -1 : 1;
      } else {
        return (this.month.getTime() < other.month.getTime()) ? -1 : 1;
      }
    }
    return -1;
  }

  getHours(type?: string, actuals?: boolean): number {
    let hours = 0.0;
    this.periods.forEach(prd => {
      hours += prd.getHours(type, actuals);
    });
    return hours;
  }

  addLeave(leave: Leave) {
    let bAdded = false;
    if (leave.hours === this.standard) {
      this.periods.forEach((prd, p) => {
        if (!bAdded && leave.code.toLowerCase() === prd.code.toLowerCase()
          && leave.status.toLowerCase() === prd.status.toLowerCase()
          && leave.leavedate.getDate() === prd.end.getDate() + 1) {
          bAdded = true;
          prd.addLeave(leave);
          this.periods[p] = prd;
        }
      });
    }
    if (!bAdded) {
      this.periods.push(new LeavePeriod(leave));
    }
  }
}