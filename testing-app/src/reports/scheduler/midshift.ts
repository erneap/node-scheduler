import { EmployeeName, IEmployeeName, IVariation, Variation } from "scheduler-node-models/scheduler/employees";

export class MidShift {
  public name: EmployeeName;
  public mid: Variation;

  constructor(name: IEmployeeName, mid: IVariation) {
    this.name = new EmployeeName();
    if (name) {
      this.name = new EmployeeName(name);
    }
    this.mid = new Variation();
    if (mid) {
      this.mid = new Variation(mid);
    }
  }

  compareTo(other?: MidShift): number {
    if (other) {
      if (this.mid.startdate.getTime() === other.mid.startdate.getTime()) {
        if (this.mid.enddate.getTime() === other.mid.enddate.getTime()) {
          if (this.name.lastname.toLowerCase() === other.name.lastname.toLowerCase()) {
            if (this.name.firstname.toLowerCase() === other.name.firstname.toLowerCase()) {
              if (this.name.middlename && other.name.middlename) {
                return (this.name.middlename.toLowerCase() < other.name.middlename.toLowerCase()) 
                  ? -1 : 1;
              } else if (this.name.middlename) {
                return 1;
              } else {
                return -1;
              }
            }
            return (this.name.firstname.toLowerCase() < other.name.firstname.toLowerCase())
              ? -1 : 1;
          }
          return (this.name.lastname.toLowerCase() < other.name.lastname.toLowerCase())
            ? -1 : 1;
        }
        return (this.mid.enddate.getTime() < other.mid.enddate.getTime()) ? -1 : 1;
      }
      return (this.mid.startdate.getTime() < other.mid.startdate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  getDaysOff(): string {
    const weekdays: boolean[] = [ false, false, false, false, false, false, false ];
    const days = [ "Su", "Mo", "Tu", "We", "Th", "Fr", "Sa" ];
    for (let i=0; i < this.mid.schedule.workdays.length; i++) {
      const day = i % 7;
      if (this.mid.schedule.workdays[i].code !== '') {
        weekdays[day] = true;
      }
    }
    let answer = "";
    weekdays.forEach((dy, d) => {
      if (!dy) {
        if (answer !== '') {
          answer += ',';
        }
        answer += days[d];
      }
    });
    return answer;
  }
}