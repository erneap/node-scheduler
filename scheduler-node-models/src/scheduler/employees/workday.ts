/**
 * Workday interface and class descriptions
 */

/**
 * This interface describes the data members to describe a workday object.
 */
export interface IWorkday {
  id: number;
  workcenter: string;
  code: string;
  hours: number;
}

/**
 * This class provide the data members and the action a workday can complete.  It will be
 * used a children of a schedule class object in an assignment or variation.
 */
export class Workday implements IWorkday {
  public id: number;
  public workcenter: string;
  public code: string;
  public hours: number;

  constructor(wd?: IWorkday) {
    this.id = (wd) ? wd.id : 0;
    this.workcenter = (wd) ? wd.workcenter : '';
    this.code = (wd) ? wd.code : '';
    this.hours = (wd) ? wd.hours : 0;
  }

  /**
   * This function is used to sort two workday objects based on the workday's identifier.
   * @param other The workday object used for the comparison
   * @returns A number value to signify this object is before or after the other.  -1 
   * represents before and 1 for after.
   */
  compareTo(other?: Workday): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return 0;
  }
}

/**
 * The schedule class and interface is for holding workdays within an assignment 
 * and variation.
 */

/**
 * This interface describes the data members to describe a schedule object.
 */
export interface ISchedule {
  id: number;
  workdays: IWorkday[];
  showdates?: boolean;
}

/**
 * This class provide the data members and the action a schedule can complete.  It will be
 * used a children of an assignment or variation.
 */
export class Schedule implements ISchedule {
  public id: number;
  public workdays: Workday[];
  public showdates: boolean;

  constructor(sch?: ISchedule) {
    this.id = (sch) ? sch.id : 0;
    this.workdays = [];
    if (sch && sch.workdays.length > 0) {
      sch.workdays.forEach(wd => {
        this.workdays.push(new Workday(wd));
      });
      this.workdays.sort((a,b) => a.compareTo(b));
    }
    this.showdates = (sch && sch.showdates) ? sch.showdates : false;
  }

  /**
   * This function will be used to sort multiple schedules based on the schedules' id.
   * @param other A schedule object used for comparison
   * @returns A numeric value to indicate whether the schedule is before or after the
   * other schedule in a list.  -1 for before and 1 for after.
   */
  compareTo(other?: Schedule): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function will retrieve a workday from the list based on the identifier provided.
   * @param id A numeric value for the identifier
   * @returns A workday object representing the requested workday.
   */
  getWorkday(id: number): Workday {
    let result: Workday = new Workday();
    this.workdays.forEach(wd => {
      if (wd.id === id) {
        result = new Workday(wd);
      }
    });
    return result;
  }

  /**
   * This function allows the caller to update a schedule's workday with the values
   * provided.
   * @param id A numeric value to identify which workday to update.
   * @param wkctr A string value representing the workcenter.
   * @param code A string value representing the work code (shift) to assign.
   * @param hours A numeric value (float) for the number of hours to work.
   */
  changeWorkday(id: number, wkctr: string, code: string, hours: number) {
    let found = false;
    for (let w=0; w < this.workdays.length && !found; w++) {
      const wd = this.workdays[w];
      if (wd.id === id) {
        found = true;
        wd.hours = hours;
        wd.code = code;
        wd.workcenter = wkctr;
        this.workdays[w] = wd;
      }
    }
    if (!found) {
      const wd = new Workday({
        id: id,
        workcenter: wkctr,
        code: code,
        hours: hours
      });
      this.workdays.push(wd);
      this.workdays.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function will update a field on a particular workday, based on the field and 
   * value.
   * @param id The numeric value to identify which workday object to change.
   * @param field The string value used to identify which data member to update.
   * @param value The string value representing the new value, either string or numeric
   * value given as a string.
   */
  updateWorkday(id: number, field: string, value: string) {
    let found = false;
    for (let w=0; w < this.workdays.length && !found; w++) {
      const wd = this.workdays[w];
      if (wd.id === id) {
        found = true;
        switch (field.toLowerCase()) {
          case "workcenter":
            wd.workcenter = value;
            break;
          case "code":
            wd.code = value;
            break;
          case 'hours':
            wd.hours = Number(value);
            break;
          case 'copy':
            let oldWkd: Workday | undefined = undefined;
            let oWkID = w;
            let bExit = false;
            while (!oldWkd && !bExit) {
              oWkID--;
              if (oWkID < 0) {
                oWkID = this.workdays.length - 1
              }
              if (oWkID === w) {
                bExit = true;
              }
              let tWkd = this.workdays[oWkID];
              if (tWkd.code !== '' && tWkd.workcenter !== '' && tWkd.hours > 0.0) {
                oldWkd = new Workday(tWkd);
              }
            }
            if (oldWkd) {
              wd.workcenter = oldWkd.workcenter;
              wd.code = oldWkd.code;
              wd.hours = oldWkd.hours;
            }
            break;
        }
        this.workdays[w] = wd;
      }
    }
  }

  /**
   * This function will either add or subtract workdays from the list to ensure
   * that there was a certain number of days in the schedule.  All schedules must
   * contain a multiple of 7 workdays.
   * @param days A numeric value, greater than zero (0) and a multiple of 7.
   * @throws An error indicating the provided parameter is zero or not a multiple of 7.
   */
  setScheduleDays(days: number): void {
    if (days <= 0 || days % 7 !== 0) {
      throw new Error('New days value must be greater than zero and a multiple of seven');
    }
    this.workdays.sort((a,b) => a.compareTo(b));
    if (days > this.workdays.length) {
      for (let w = this.workdays.length; w < days; w++) {
        const wd = new Workday();
        wd.id = w;
        this.workdays.push(wd);
      }
    } else if (days < this.workdays.length) {
      while (this.workdays.length > days) {
        this.workdays.pop();
      }
    }
    for (let w=0; w < this.workdays.length; w++) {
      this.workdays[w].id = w;
    }
  }
}