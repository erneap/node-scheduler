import { ILeave, Leave } from "scheduler-models/scheduler/employees";

export class LeaveGroup {
  leaves: Leave[];

  constructor(gp?: LeaveGroup) {
    this.leaves = [];
    if (gp) {
      gp.leaves.forEach(lv => {
        this.leaves.push(new Leave(lv));
      });
      this.leaves.sort((a,b) => a.compareTo(b))
    }
  }

  getCode(): string {
    if (this.leaves.length > 0) {
      return this.leaves[0].code;
    }
    return "";
  }

  getLastDate(): number {
    if (this.leaves.length > 0) {
      this.leaves.sort((a,b) => a.compareTo(b));
      return this.leaves[this.leaves.length - 1].leavedate.getUTCDate();
    }
    return 0;
  }

  getFirstDate(): number {
    if (this.leaves.length > 0) {
      this.leaves.sort((a,b) => a.compareTo(b));
      return this.leaves[0].leavedate.getUTCDate();
    }
    return 0;
  }

  addLeave(lv: ILeave) {
    this.leaves.push(new Leave(lv));
  }

  addToThisGroup(olv: ILeave): boolean {
    const lv = new Leave(olv);
    let add = false;
    for (let i=0; i < this.leaves.length && !add; i++) {
      const ld = this.leaves[i];
      if (ld.code.toLowerCase() === lv.code.toLowerCase() 
        && ld.status.toLowerCase() === lv.status.toLowerCase() 
        && lv.leavedate.getUTCDate() === ld.leavedate.getUTCDate() + 1
        && lv.hours >= 8.0 && ld.hours >= 8.0) {
        add = true;
      }
    }
    return add;
  }

  compareTo(other?: LeaveGroup): number {
    if (other) {
      if (this.getFirstDate() !== 0 && other.getFirstDate() !== 0) {
        return (this.getFirstDate() < other.getFirstDate()) ? -1 : 1;
      } else if (this.getFirstDate() === 0) {
        return 1;
      } else {
        return -1;
      }
    }
    return -1;
  }
}

export class LeaveMonth {
  month: Date;
  active: Boolean;
  leaveGroups: LeaveGroup[];

  constructor(lm?: LeaveMonth) {
    this.month = (lm) ? new Date(lm.month) : new Date();
    this.active = (lm) ? lm.active : true;
    this.leaveGroups = [];
    if (lm && lm.leaveGroups.length > 0) {
      lm.leaveGroups.forEach(lg => {
        this.leaveGroups.push(lg);
      });
      this.leaveGroups.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: LeaveMonth): number {
    if (other) {
      return (this.month.getTime() < other.month.getTime()) ? -1 : 1;
    }
    return -1;
  }
}