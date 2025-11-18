import { LaborCode } from "../labor/laborcode";
import { EmployeeLaborCode, IEmployeeLaborCode } from "./labor";
import { ISchedule, Schedule, Workday } from "./workday";

/**
 * Assignments are the first level of scheduling.  It defines the current normal work
 * schedule(s).  It should start with the employee's initial hire date and the employee's
 * last assignment will have the employee's departure date from the company.  Each time an
 * employee's schedule permanently changes, a new assignment needs to be created to 
 * maintain a work history.
 */

/**
 * This interface defines a work assignment for an employee.
 */
export interface IAssignment {
  id: number;
  site: string;
  workcenter: string;
  startDate: Date;
  endDate: Date;
  schedules: ISchedule[];
  rotationdate?: Date;
  rotationdays?: number;
  laborcodes?: IEmployeeLaborCode[];
}

/**
 * This class defines an employee's work assignment.  The data members are:
 * id (numeric value for the key to this assignment)
 * site (the string value for the work site within the team)
 * workcenter (the string value for the work center the schedule applies to)
 * startdate (date object to define the start of the assignment.)
 * enddate (date object to define the end of an assignment, to no longer use)
 * rotationdate (Optional - defines a base date when multiple schedule are used in an
 * assignment, especially for schedules that rotate every ### number of days.)
 * rotationdays (Optional - defines the number of days to rotate upon from the base
 * rotation date.  It must be a multiple of the number of days in the schedule.)
 * laborcodes (an array of employeelaborcode objects to define the assigned labor codes
 * for consideration)
 */
export class Assignment {
  public id: number;
  public site: string;
  public workcenter: string;
  public startDate: Date;
  public endDate: Date;
  public schedules: Schedule[];
  public rotationdate?: Date;
  public rotationdays?: number;
  public laborcodes: EmployeeLaborCode[];

  constructor(asgmt?: IAssignment) {
    this.id = (asgmt) ? asgmt.id : 0;
    this.site = (asgmt) ? asgmt.site : '';
    this.workcenter = (asgmt) ? asgmt.workcenter : '';
    this.startDate = (asgmt) ? new Date(asgmt.startDate) : new Date(0);
    this.endDate = (asgmt) ? new Date(asgmt.endDate) : new Date(Date.UTC(9999, 11, 31));
    this.schedules = [];
    if (asgmt && asgmt.schedules.length > 0) {
      asgmt.schedules.forEach(sch => {
        this.schedules.push(new Schedule(sch));
      });
      this.schedules.sort((a,b) => a.compareTo(b))
    }
    this.rotationdate = (asgmt && asgmt.rotationdate) 
      ? new Date(asgmt.rotationdate) : undefined;
    this.rotationdays = (asgmt && asgmt.rotationdays && asgmt.rotationdays > 0)
      ? asgmt.rotationdays : undefined
    this.laborcodes = [];
    if (asgmt && asgmt.laborcodes && asgmt.laborcodes?.length > 0) {
      asgmt.laborcodes.forEach(lc => {
        this.laborcodes.push(new EmployeeLaborCode(lc));
      });
      this.laborcodes.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function is used in sorting of the assignment from others.  It used the 
   * assignment start and end dates for sorting comparison.
   * @param other An assignment object to use in comparison
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before, 1 for after or 0 for equal.
   */
  compareTo(other?: Assignment): number {
    if (other) {
      if (this.startDate.getTime() === other.startDate.getTime()) {
        return (this.endDate.getTime() < other.endDate.getTime()) ? -1 : 1;
      }
      return (this.startDate.getTime() < other.startDate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function is used to determine if this assignment should be used at a particular
   * site and date.
   * @param site The string value of a site designation.
   * @param date The date object to compare with the start and end dates.
   * @returns The boolean value for whether this assignment is for a site and between 
   * this start and end dates.
   */
  useSiteAssignment(site: string, date: Date): boolean {
    return (this.site.toLowerCase() === site.toLowerCase()
      && this.startDate.getTime() <= date.getTime()
      && this.endDate.getTime() >= date.getTime());
  }

  /**
   * This function is used to determine if this assignment should be used based on the
   * date provided.
   * @param date The date object used in comparision
   * @returns The boolean value for whether this assignment is between the start and end
   * dates.
   */
  useAssignment(date: Date, date2?: Date, labor?: LaborCode): boolean {
    let answer = false;
    if (labor && date2) {
      this.laborcodes.forEach(lc => {
        if (labor.chargeNumber && lc.chargenumber && labor.extension && lc.extension) {
          if (labor.chargeNumber.toLowerCase() === lc.chargenumber.toLowerCase()
            && labor.extension.toLowerCase() === lc.extension.toLowerCase()
            && date.getTime() <= this.endDate.getTime() 
            && date2.getTime() >= this.startDate.getTime()) {
            answer = true;
          }
        }
      });
    } else {
      answer = (this.startDate.getTime() <= date.getTime()
        && this.endDate.getTime() >= date.getTime());
    }
    return answer;
  }

  /**
   * This function will provide the daily standard work day hours, based on a count of
   * the schedule's workdays and a 40 hour work week.
   * @returns A numeric value for the standard day's work hours.
   */
  getStandardWorkHours(): number {
    let count = 0;
    const sched = this.schedules[0];
    sched.workdays.forEach(wd => {
      if (wd.code !== '') {
        count++;
      }
    });
    const weeks = Math.floor(sched.workdays.length/7);
    return (40.0 * weeks) / count;
  }

  /**
   * This function is used to provide the workday object for a particular date.
   * @param date The date object used to find the workday
   * @returns A workday object if the schedule can be used or undefined if not.
   */
  getWorkday(date: Date): Workday | undefined {
    // ensure the assignment base date is on a sunday.
    let start = new Date(this.startDate);
    while (start.getDay() !== 0) {
      start = new Date(start.getTime() - (24 * 60 * 60 * 1000));
    }

    // determine the number of days since the base date for the date provided
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 3600000));
    // determine whether to use a single schedule or to rotate between multiple schedules
    // based on rotation date and days.  if rotationday is undefined or 0, use single or
    // if only one schedule is provided.  Else use multiple schedule and rotate between
    // them.
    if (this.schedules.length === 1 || !this.rotationdays || this.rotationdays === 0) {
      const iDay = days % this.schedules[0].workdays.length;
      return this.schedules[0].getWorkday(iDay)
    } else if (this.schedules.length > 1) {
      const schID = Math.floor((days / this.rotationdays) % this.schedules.length);
      const iDay = days % this.schedules[schID].workdays.length;
      return this.schedules[schID].getWorkday(iDay)
    }
    return undefined;
  }

  /**
   * This function adds a new schedule with a set number of days in the schedule.
   * @param days The numeric value for the number of workday objects within the schedule.
   * This must be a multiple of 7.
   */
  addSchedule(days: number) {
    if ((days % 7) !== 0) {
      return new Error('Schedule days must be multiple of 7');
    }
    const newSchedule = new Schedule();
    this.schedules.sort((a,b) => a.compareTo(b));
    newSchedule.id = this.schedules[this.schedules.length - 1].id + 1;
    newSchedule.setScheduleDays(days);
    this.schedules.push(newSchedule);
  }

  /**
   * This function will change the number of workdays within an existing schedule.
   * @param schID The numeric value for the schedule's identifier to change.
   * @param days The numeric value for the number of workday objects to change the 
   * schedule to.  This must be a multiple of 7.
   */
  changeScheduleDays(schID: number, days: number) {
    if ((days % 7) !== 0) {
      return new Error('Schedule must have a multiple of 7 days.')
    }
    this.schedules.forEach(sch => {
      if (sch.id === schID) {
        sch.setScheduleDays(days);
      }
    });
  }

  /**
   * This function is used to completely change a schedule's workday
   * @param schID The numeric value to identify the schedule to update
   * @param wdID The numeric value to identity which of the schedule's workday to change
   * @param wkctr The string value for the new workcenter.
   * @param code The string value for the new work code.
   * @param hours The numeric valur for the hours to work.
   */
  changeWorkday(schID: number, wdID: number, wkctr: string, code: string, hours: number) {
    let found = false;
    for (let s=0; s < this.schedules.length && !found; s++) {
      const sched = this.schedules[s];
      if (sched.id === schID) {
        found = true;
        sched.changeWorkday(wdID, wkctr, code, hours);
        this.schedules[s] = sched;
      }
    }
    if (!found) {
      throw new Error("Schedule not found!");
    }
  }

  /**
   * This function is used to update a single field  in a schedule's workday.
   * @param schID The numeric value to identify the schedule to update
   * @param wdID The numeric value to identify which of the schedule's workdays to update
   * @param field The string value to identify which field within the workday to update
   * @param value The string value (string or numeric string) to update the value of the
   * data member.
   */
  updateWorkday(schID: number, wdID: number, field: string, value: string) {
    let found = false;
    for (let s=0; s < this.schedules.length && !found; s++) {
      const sched = this.schedules[s];
      if (sched.id === schID) {
        found = true;
        sched.updateWorkday(wdID, field, value);
        this.schedules[s] = sched;
      }
    }
    if (!found) {
      throw new Error("Schedule not found!");
    }
  }

  /**
   * This function is used to remove a schedule from this assignment.  An assignment must
   * have a minimum of one schedule, so if removal put the schedule list below 1, a new
   * schedule is added and empty.
   * @param schid The numeric value key for the schedule to remove.
   */
  removeSchedule(schid: number) {
    // first search the schedule list for the correct schedule to remove.
    let found = -1;
    for (let s=0; s < this.schedules.length && found < 0; s++) {
      if (this.schedules[s].id === schid) {
        found = s;
      }
    }
    // if the schedule is present, remove and check to ensure at least one schedule is
    // present.
    if (found >= 0) {
      this.schedules.splice(found, 1);
      if (this.schedules.length === 0) {
        this.schedules.push(new Schedule({
          id: 0,
          workdays: [],
          showdates: false
        }))
      }
    } else {
      throw new Error('Schedule not found');
    }
  }

  /**
   * This function will add a new labor code (charge number and extension) to this 
   * assignment's labor code list.
   * @param chgno The string value for the charge number to add
   * @param ext The string value for the extension to add
   */
  addLaborCode(chgno: string, ext: string) {
    // first check to see if the charge number and extension is listed in this assignment.
    let found = false;
    for (let l=0; l < this.laborcodes.length && !found; l++) {
      if (this.laborcodes[l].chargenumber.toLowerCase() === chgno.toLowerCase()
        && this.laborcodes[l].extension.toLowerCase() === ext.toLowerCase()) {
        found = true;
      }
    }
    // if not found, add it as an employee labor code object.
    if (!found) {
      this.laborcodes.push(new EmployeeLaborCode({
        chargenumber: chgno,
        extension: ext
      }));
      this.laborcodes.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function will remove an employee labor code from the list, based on its
   * charge number and extension.
   * @param chgno The string value for the charge number to remove
   * @param ext The string value for the extension to remove
   */
  removeLaborCode(chgno: string, ext: string) {
    let found = -1;
    for (let l=0; l < this.laborcodes.length && !found; l++) {
      if (this.laborcodes[l].chargenumber.toLowerCase() === chgno.toLowerCase()
        && this.laborcodes[l].extension.toLowerCase() === ext.toLowerCase()) {
        found = l;
      }
    }
    if (found >= 0) {
      this.laborcodes.splice(found, 1);
      this.laborcodes.sort((a,b) => a.compareTo(b));
    }
  }
}