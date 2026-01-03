import { ISchedule, Schedule, Workday } from "./workday";

/**
 * This interface provides the basis for a variation (a small change to an employee's
 * assignment and schedule)
 */
export interface IVariation {
  id: number;
  site: string;
  mids: boolean;
  mod: boolean;
  startdate: Date;
  enddate: Date;
  schedule: ISchedule;
}

/**
 * This class description is for a schedule variation.  A schedule variation is used
 * for a small change in an employee's schedule, one that will revert back to the primary
 * schedule after the change period is complete.  The data members are:
 * id (numeric value for the primary key)
 * site (the string value for the site the employee is assigned)
 * mids (A boolean value for variations is associated with a temporary mid shift assignment)
 * startdate (a date object for the start of the variation period)
 * enddate (a date object for the end of the variation period)
 * schedule (a schedule object containing a group of workday objects which is used to 
 * define the days of the variation).
 */
export class Variation implements IVariation {
  public id: number;
  public site: string;
  public mids: boolean;
  public mod: boolean;
  public startdate: Date;
  public enddate: Date;
  public schedule: Schedule;

  constructor(vari?: IVariation) {
    this.id = (vari) ? vari.id : 0;
    this.site = (vari) ? vari.site : '';
    this.mids = (vari) ? vari.mids : false;
    this.mod = (vari) ? vari.mod : false;
    this.startdate = (vari) ? new Date(vari.startdate) : new Date();
    this.enddate = (vari) ? new Date(vari.enddate) : new Date();
    this.schedule = (vari) ? new Schedule(vari.schedule)
      : new Schedule();
  }

  /**
   * This function is used to sort this object from another variation object
   * @param other The other variation object for comparison
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before or 1 for after.
   */
  compareTo(other?: Variation): number {
    if (other) {
      if (this.startdate.getTime() === other.startdate.getTime()) {
        if (this.enddate.getTime() === other.enddate.getTime()) {
          return (this.id < other.id) ? -1 : 1;
        }
        return (this.enddate.getTime() < other.enddate.getTime()) ? -1 : 1;
      }
      return (this.startdate.getTime() < other.startdate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function is used to determine if the variation is usable on a particular
   * date.
   * @param date The date object used to compare for use.
   * @returns a boolean value if the date fits within the variation's period.
   */
  useVariation(date: Date): boolean {
    return (this.startdate.getTime() <= date.getTime()
      && this.enddate.getTime() >= date.getTime());
  }

  /**
   * This function will update the variation's schedule with the days from the sunday 
   * prior to start and the saturday after the end date.
   */
  setScheduleDays() {
    let start = new Date(this.startdate);
    while (start.getUTCDay() !== 0) {
      start = new Date(start.getTime() - (24 * 3600000));
    }
    let end = new Date(this.enddate);
    while (end.getUTCDay() !== 6) {
      end = new Date(end.getTime() + (24 * 3600000));
    }

    this.schedule.workdays = [];
    let count = -1;
    while (start.getTime() <= end.getTime()) {
      count++;
      const wd = new Workday();
      wd.id = count;
      this.schedule.workdays.push(wd);
      start = new Date(start.getTime() + (24 * 3600000));
    }
  }

  /**
   * This function is used to find the workday object from the variation's schedule for
   * the date requested.  The workday is found by the number of days since the sunday 
   * prior to the start date.
   * @param date The date object used to determine the workday.
   * @returns The workday object representing the requested workday.
   */
  getWorkday(date: Date): Workday {
    let start = new Date(this.startdate);
    while (start.getUTCDay() !== 0) {
      start = new Date(start.getTime() - (24 * 3600000));
    }
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 3600000));
    const iDay = days % this.schedule.workdays.length;
    return this.schedule.getWorkday(iDay);
  }

  /**
   * This function is used to completely change a variation's workday
   * @param wdID The numeric value to identity which of the schedule's workday to change
   * @param wkctr The string value for the new workcenter.
   * @param code The string value for the new work code.
   * @param hours The numeric valur for the hours to work.
   */
  changeWorkday(wdID: number, wkctr: string, code: string, hours: number) {
    let found = false;
    this.schedule.changeWorkday(wdID, wkctr, code, hours);
  }

  /**
   * This function is used to update a single field  in a schedule's workday.
   * @param wdID The numeric value to identify which of the schedule's workdays to update
   * @param field The string value to identify which field within the workday to update
   * @param value The string value (string or numeric string) to update the value of the
   * data member.
   */
  updateWorkday(wdID: number, field: string, value: string) {
    let found = false;
    this.schedule.updateWorkday(wdID, field, value);
  }

  /**
   * This function will set the workday's values from the client app the day of the 
   * schedule from a date.
   * @param date The date object for the date of the workday.
   * @param wkctr The string value representing the workcenter.
   * @param code The string value for the work code to use on the day.
   * @param hours The numeric value (float) for the number of hours to work on that day.
   */
  updateWorkdayByDate(date: Date, wkctr: string, code: string, hours: number) {
    if (date.getTime() >= this.startdate.getTime() 
      && date.getTime() <= this.enddate.getTime()) {
      let start = new Date(this.startdate);
      while (start.getDay() !== 0) {
        start = new Date(start.getTime() - (24 * 3600000));
      }
      const dos = Math.floor((date.getTime() - start.getTime()) / (24 * 3600000));
      this.schedule.changeWorkday(dos, wkctr, code, hours);
    }
  }
}