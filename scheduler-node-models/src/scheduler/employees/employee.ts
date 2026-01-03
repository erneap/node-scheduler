import { ObjectId } from "mongodb";
import { EmployeeName, IEmployeeName } from "./employeename";
import { ICompanyInfo } from "./companyinfo";
import { Assignment, IAssignment } from "./assignment";
import { IVariation, Variation } from "./variation";
import { ILeaveRequest, LeaveRequest, LeaveRequestComment } from "./leaverequest";
import { EmployeeLaborCode, IEmployeeLaborCode } from "./labor";
import { IWork, Work } from "./work";
import { IUser, User } from "../../users";
import { Contact, IContact } from "./contact";
import { ISpecialty, Specialty } from "./specialty";
import { ILeave, Leave } from "./leave";
import { Schedule, Workday } from "./workday";
import { AnnualLeave, IAnnualLeave } from "./balance";
import { CompareWorkCode, Workcode } from '../labor/workcode';
import { ChangeLeaveRequestResponse } from "./web"
import { LaborCode } from "../labor/laborcode";

/**
 * The employee is recorded by 
 */
export interface IEmployee {
  _id?: ObjectId;
  id?: string;
  team: string;
  site: string;
  email: string;
  name: IEmployeeName;
  companyinfo: ICompanyInfo;
  assignments?: IAssignment[];
  variations?: IVariation[];
  balances?: IAnnualLeave[];
  leaves?: ILeave[];
  requests?: ILeaveRequest[];
  laborCodes?: IEmployeeLaborCode[];
  work?: IWork[];
  user?: IUser;
  contactinfo?: IContact[];
  specialties?: ISpecialty[];
  emails?: string[];
}

export class Employee implements IEmployee {
  public id: string;
  public team: string;
  public site: string;
  public email: string;
  public name: EmployeeName;
  public companyinfo: ICompanyInfo;
  public assignments: Assignment[];
  public variations: Variation[];
  public balances: AnnualLeave[];
  public leaves: Leave[];
  public requests: LeaveRequest[];
  public laborCodes: EmployeeLaborCode[];
  public work?: Work[];
  public user?: User;
  public contactinfo: Contact[];
  public specialties: Specialty[];
  public emails: string[];

  constructor(emp?: IEmployee) {
    this.id = (emp && emp.id) ? emp.id : '';
    if (this.id === '') {
      this.id = (emp && emp._id) ? emp._id.toString() : '';
    }
    this.team = (emp) ? emp.team : '';
    this.site = (emp) ? emp.site : '';
    this.email = (emp) ? emp.email : '';
    this.name = (emp) ? new EmployeeName(emp.name) : new EmployeeName();
    this.companyinfo = (emp) ? emp.companyinfo : { company: '', employeeid: '' };
    this.assignments = [];
    if (emp && emp.assignments && emp.assignments.length > 0) {
      emp.assignments.forEach(a => {
        this.assignments.push(new Assignment(a));
      });
      this.assignments.sort((a,b) => a.compareTo(b));
    }
    this.variations = [];
    if (emp && emp.variations && emp.variations.length > 0) {
      emp.variations.forEach(v => {
        this.variations.push(new Variation(v));
      });
      this.variations.sort((a,b) => a.compareTo(b));
    }
    this.balances = [];
    if (emp && emp.balances && emp.balances.length > 0) {
      emp.balances.forEach(b => {
        this.balances.push(new AnnualLeave(b));
      });
      this.balances.sort((a,b) => a.compareTo(b));
    }
    this.leaves = [];
    if (emp && emp.leaves && emp.leaves.length > 0) {
      emp.leaves.forEach(l => {
        this.leaves.push(new Leave(l));
      });
      this.leaves.sort((a,b) => a.compareTo(b));
    }
    this.requests = [];
    if (emp && emp.requests && emp.requests.length > 0) {
      emp.requests.forEach(r => {
        this.requests.push(new LeaveRequest(r));
      });
      this.requests.sort((a,b) => a.compareTo(b));
    }
    this.laborCodes = [];
    if (emp && emp.laborCodes && emp.laborCodes.length > 0) {
      emp.laborCodes.forEach(l => {
        this.laborCodes.push(new EmployeeLaborCode(l));
      });
      this.laborCodes.sort((a,b) => a.compareTo(b));
    }
    this.contactinfo = [];
    if (emp && emp.contactinfo && emp.contactinfo.length > 0) {
      emp.contactinfo.forEach(c => {
        this.contactinfo.push(new Contact(c));
      });
      this.contactinfo.sort((a,b) => a.compareTo(b));
    }
    this.specialties = [];
    if (emp && emp.specialties && emp.specialties.length > 0) {
      emp.specialties.forEach(sp => {
        this.specialties.push(new Specialty(sp));
      });
      this.specialties.sort((a,b) => a.compareTo(b));
    }
    this.emails = [];
    if (emp && emp.emails && emp.emails.length > 0) {
      emp.emails.forEach(e => {
        this.emails.push(e);
      });
      this.emails.sort((a,b) => (a < b) ? -1 : 1);
    }
    if (emp && emp.work && emp.work.length > 0) {
      this.work = [];
      emp.work.forEach(w => {
        this.work!.push(new Work(w));
      });
      this.work.sort((a,b) => a.compareTo(b));
    } else {
      this.work = undefined;
    }
    if (emp && emp.user) {
      this.user = new User(emp.user);
    } else {
      this.user = undefined;
    }
  }

  compareTo(other?: Employee): number {
    if (other) {
      if (this.name.lastname === other.name.lastname) {
        if (this.name.firstname === other.name.firstname) {
          if (this.name.middlename && other.name.middlename) {
            return (this.name.middlename < other.name.middlename) ? -1 : 1;
          } else if (this.name.middlename) {
            return -1;
          } else {
            return 1;
          }
        }
        return (this.name.firstname < other.name.firstname) ? -1 : 1;
      }
      return (this.name.lastname < other.name.lastname) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function will clone this object, but remove all the work and user objects
   * so they aren't saved in the database.  They are saved in other collections.
   * @returns An employee object for saving to the database
   */
  cloneForSave(): Employee {
    const result = new Employee(this);
    result.work = undefined;
    result.user = undefined;
    return result;
  }

  /**
   * This function is designed to remove old data from this employee object.  It will
   * remove old variations, leaves, leave requests, and leave balances, if they are
   * older than the date given.
   * @param date This date value is used for comparison, for anything before this date.
   * @returns A boolean value to indicate to the calling function whether or not to
   * remove this employee.
   */
  purge(date: Date): boolean {
    // purge old variations
    this.variations.sort((a,b) => a.compareTo(b));
    for (let v=this.variations.length - 1; v >= 0; v--) {
      if (this.variations[v].enddate.getTime() < date.getTime()) {
        this.variations.splice(v, 1);
      }
    }

    // purge old leaves and leave requests(based on request's end date)
    this.leaves.sort((a,b) => a.compareTo(b));
    for (let l=this.leaves.length - 1; l >= 0; l--) {
      if (this.leaves[l].leavedate.getTime() < date.getTime()) {
        this.leaves.splice(l, 1);
      }
    }
    for (let l=this.requests.length - 1; l >= 0; l--) {
      if (this.requests[l].enddate.getTime() < date.getTime()) {
        this.requests.splice(l, 1);
      }
    }

    // purge old leave balances
    this.balances.sort((a,b) => a.compareTo(b));
    for (let b=this.balances.length - 1; b >= 0; b--) {
      if (this.balances[b].year < date.getUTCFullYear()) {
        this.balances.splice(b, 1);
      }
    }

    // return as to whether the employee quit before date
    this.assignments.sort((a,b) => a.compareTo(b));
    const last = this.assignments[this.assignments.length -1];
    return (last.endDate.getTime() < date.getTime());
  }

  /**********************************************************************************
   * This is the assignments section for modifying the assignment list.
   **********************************************************************************/

  /**
   * Remove Leaves between and including dates.
   * @param start The date for the start of the removal
   * @param end The date for the end of the removal
   * @param reqID (Optional) the string value for a possible request identifier
   * @param includeActuals (Optional) the boolean value to delete actuals
   */
  removeLeaves(start: Date, end: Date, reqID: string = '', includeActuals: boolean = true) {
    this.leaves.sort((a,b) => a.compareTo(b));
    for (let l=this.leaves.length - 1; l >= 0; l--) {
      if (reqID === '' && includeActuals) {
        if (this.leaves[l].leavedate.getTime() >= start.getTime() 
          && this.leaves[l].leavedate.getTime() <= end.getTime()) {
          this.leaves.splice(l, 1);
        }
      } else if (reqID !== '' && includeActuals) {
        if (this.leaves[l].leavedate.getTime() >= start.getTime() 
          && this.leaves[l].leavedate.getTime() <= end.getTime()
          && this.leaves[l].requestid === reqID) {
          this.leaves.splice(l, 1);
        }
      } else if (reqID === '' && !includeActuals) {
        if (this.leaves[l].leavedate.getTime() >= start.getTime() 
          && this.leaves[l].leavedate.getTime() <= end.getTime()
          && this.leaves[l].status.toLowerCase() !== 'actual') {
          this.leaves.splice(l, 1);
        }
      } else if (reqID !== '' && !includeActuals) {
        if (this.leaves[l].leavedate.getTime() >= start.getTime() 
          && this.leaves[l].leavedate.getTime() <= end.getTime()
          && this.leaves[l].status.toLowerCase() !== 'actual'
          && this.leaves[l].requestid === reqID) {
          this.leaves.splice(l, 1);
        }
      }
    }
  }

  /**
   * This function is used to determine if the employee is active on the date given.
   * @param date The date object used to determine whether or not the employee was active
   * on this date.
   * @returns A boolean value for whether or not the employee was active.
   */
  isActive(date: Date): boolean {
    let result = false;
    this.assignments.forEach(a => {
      if (a.useSiteAssignment(this.site, date)) {
        result = true;
      }
    });
    return result;
  }

  /**
   * This function is used to determine if the employee is active during a particular
   * period of time at a site and workcenter.
   * @param site The string value to designate the site.
   * @param wkctr The string value to designate the workcenter.
   * @param start The date object for the start of the requested period.
   * @param end The date object for the end of the requested period.
   * @returns The boolean value to indicate the employee was working at the site and 
   * workcenter during the period.
   */
  isAssigned(site: string, wkctr: string, start: Date, end: Date): boolean {
    let result = false;
    this.assignments.forEach(a => {
      if (a.site.toLowerCase() === site.toLowerCase()
        && a.workcenter.toLowerCase() === wkctr.toLowerCase() 
        && ((start.getTime() < a.startDate.getTime() 
        && end.getTime() > a.endDate.getTime()) 
        || (end.getTime() > a.startDate.getTime()
        && end.getTime() < a.endDate.getTime())
        || (start.getTime() > a.startDate.getTime()
        && end.getTime() < a.endDate.getTime()))) {
        result = true;
      }
    });
    return result;
  }

  /**
   * This function is used to determine if the employee is active at a site during a
   * period of time.
   * @param site The string value to designate the site.
   * @param start The date object for the start of the requested period.
   * @param end The date object for the end of the requested period.
   * @returns The boolean value to indicate the employee was working at the site during
   * the period.
   */
  atSite(site: string, start: Date, end: Date): boolean {
    let result = false;
    this.assignments.forEach(a => {
      if (a.site.toLowerCase() === site.toLowerCase() 
        && ((start.getTime() < a.startDate.getTime() 
        && end.getTime() > a.endDate.getTime()) 
        || (end.getTime() > a.startDate.getTime()
        && end.getTime() < a.endDate.getTime())
        || (start.getTime() > a.startDate.getTime()
        && end.getTime() < a.endDate.getTime()))) {
        result = true;
      }
    });
    return result;
  }

  /**
   * This general function is used to get the employee's workday for a date.  There are
   * three possible types of request: general, actuals, and without leave.  It will 
   * provide the workday, if the employee will work or was working on the date.
   * @param date The date object representing the date to check against.
   * @param type The string value for the type of request to conduct:  general, actuals
   * or noleaves.
   * @param labor An array of Employee Labor Codes to compare against in the "actuals"
   * type request.
   * @returns A workday object for the work to be or was performed.  Will return undefined
   * for a day not working or on leave.
   */
  getWorkday(date: Date, type: string = 'general', 
    labor?: EmployeeLaborCode[]): Workday | undefined {
    // calls one of three child functions (private) to provide the data
    switch (type.toLowerCase()) {
      case "actuals":
        return this.getWorkdayActual(date, labor);
        break;
      case "noleaves":
        return this.getWorkdayWOLeaves(date);
        break;
      default:
        return this.getWorkdayGeneral(date);
    }
  }

  /**
   * This private function will provide the employee's workday based on assignment, then
   * variation and lastly leaves.  Actual work hours are used for dates where they are
   * before or on the date of the newest work record.
   * @param date The date object used for comparison
   * @returns A workday object or undefined for the employee's workday on the date.
   */
  private getWorkdayGeneral(date: Date): Workday | undefined {
    let wday: Workday|undefined;
    let stdWorkday = 8.0;
    let work = 0.0;
    let siteid = '';
    let lastWorked = new Date(0);

    // first get the standard workday hours;
    this.assignments.forEach(asgmt => {
      if (asgmt.useSiteAssignment(this.site, date)) {
        stdWorkday = asgmt.getStandardWorkHours();
      }
    });

    // check work records for work hours
    if (this.work) {
      this.work.forEach(wk => {
        if (wk.useWork(date) && wk.modtime) {
          work += wk.hours;
        }
        if (wk.dateworked.getTime() > lastWorked.getTime()) {
          lastWorked = new Date(wk.dateworked);
        }
      });
    }

    // now get the normal workday based on assignment
    this.assignments.forEach(asgmt => {
      if (asgmt.useAssignment(date)) {
        wday = asgmt.getWorkday(date);
        siteid = asgmt.site;
      }
    });

    // next, check for variation on date
    this.variations.forEach(vari => {
      if (vari.useVariation(date)) {
        wday = vari.getWorkday(date);
      }
    });
    if (work > 0.0) {
      while (!wday || (wday && wday.code === '')) {
        date = new Date(date.getTime() - (24 * 3600000));
        this.assignments.forEach(asgmt => {
          if (asgmt.useAssignment(date)) {
            wday = asgmt.getWorkday(date);
          }
        });
      }
      wday.hours = work;
      return wday;
    }

    // lastly check leave list 
    this.leaves.forEach(lv => {
      if (lv.useLeave(date) 
        && (lv.hours > stdWorkday / 2 || lv.status.toLowerCase() === 'actual')) {
        wday = new Workday({
          id: 0,
          workcenter: '',
          code: lv.code,
          hours: lv.hours
        });
      }
    });
    return wday;
  }

  /**
   * This private function provides the employee's workday for a particular date, but
   * only provides leaves if the labor codes provided is a primary code for the 
   * employee.
   * @param date The date object to compare for the workday.
   * @param labor The charge number and extension array for comparison against the 
   *  employee's labor codes to determine if it is a primary code.
   * @returns A workday object or undefined for the employee's workday on the date.
   */
  private getWorkdayActual(date: Date, labor?: EmployeeLaborCode[]): Workday | undefined {
    let wday: Workday | undefined;
    let siteid: string = '';
    let bPrimary = false;
    this.assignments.forEach(asgmt => {
      if (asgmt.useAssignment(date)) {
        siteid = asgmt.site;
        wday = asgmt.getWorkday(date);
        labor?.forEach(lc => {
          asgmt.laborcodes.forEach(alc => {
            if (lc.chargenumber.toLowerCase() === alc.chargenumber.toLowerCase()
              && lc.extension.toLowerCase() === alc.extension.toLowerCase()) {
              bPrimary = true;
            }
          })
        });
      }
    });
    this.variations.forEach(vari => {
      if (vari.useVariation(date)) {
        wday = vari.getWorkday(date);
      }
    });
    let bLeave = false;
    if (bPrimary || labor?.length === 0) {
      this.leaves.forEach(lv => {
        if (lv.useLeave(date) && lv.status.toLowerCase() === 'actual') {
          if (!bLeave) {
            wday = new Workday({
              id: 0,
              workcenter: '',
              code: lv.code,
              hours: lv.hours
            });
          } else {
            if (wday) {
              if (lv.hours <= wday.hours) {
                wday.hours += lv.hours;
              } else {
                wday.hours += lv.hours;
                wday.code = lv.code;
              }
            }
          }
        }
      })
    }
    return wday;
  }

  /**
   * This private function provides the employee's workday without leaves in consideration.
   * @param date The date object used for comparison 
   * @returns A workday object or undefined for the employee's workday on the date.
   */
  private getWorkdayWOLeaves(date: Date, useWork?: boolean): Workday | undefined {
    let wday: Workday|undefined;
    let stdWorkday = 8.0;
    let work = 0.0;
    let siteid = '';
    let lastWorked = new Date(0);

    // first get the standard workday hours;
    this.assignments.forEach(asgmt => {
      if (asgmt.useSiteAssignment(this.site, date)) {
        stdWorkday = asgmt.getStandardWorkHours();
      }
    });

    // check work records for work hours
    if (this.work) {
      this.work.forEach(wk => {
        if (wk.useWork(date) && wk.modtime) {
          work += wk.hours;
        }
        if (wk.dateworked.getTime() > lastWorked.getTime()) {
          lastWorked = new Date(wk.dateworked);
        }
      });
    }

    // now get the normal workday based on assignment
    this.assignments.forEach(asgmt => {
      if (asgmt.useAssignment(date)) {
        wday = asgmt.getWorkday(date);
        siteid = asgmt.site;
      }
    });

    // next, check for variation on date
    this.variations.forEach(vari => {
      if (vari.useVariation(date)) {
        wday = vari.getWorkday(date);
      }
    });
    if (work > 0.0) {
      while (!wday || (wday && wday.code === '')) {
        date = new Date(date.getTime() - (24 * 3600000));
        this.assignments.forEach(asgmt => {
          if (asgmt.useAssignment(date)) {
            wday = asgmt.getWorkday(date);
          }
        });
      }
      wday.hours = work;
      return wday;
    }
    if (useWork && date.getTime() <= lastWorked.getTime()) {
      wday = undefined;
    }
    return wday;
  }

  /**
   * This function provides the employee's standard workday hours, which is based on a
   * 40-hour work week divided by number of days worked in the work week.
   * @param date The date object used to determine the assignment to use.
   * @returns The float number value for the number of hours normal for each day's work.
   */
  getStandardWorkday(date: Date): number {
    let answer = 8.0;
    this.assignments.forEach(asgmt => {
      if (asgmt.useAssignment(date)) {
        answer = asgmt.getStandardWorkHours();
      }
    });
    return answer;
  }

  /**
   * This function will add a new work assignment to the employee's assignment list.  It 
   * will assign the employee to a site and workcenter on a particular date.  It is 
   * assumed that this is the last assignment in the list, the end date is set to 
   * 12/31/9999.  It also sets the previous assignment to the end date of the start date
   * value minus one day.
   * @param site The string value for the site to assign the employee to.
   * @param wkctr The string value for the workcenter to assign the employee to.
   * @param start The date object used to mark the start of the assignment
   */
  addAssignment(site: string, wkctr: string, start: Date) {
    let max = -1;
    this.assignments.sort((a,b) => a.compareTo(b));
    this.assignments.forEach(asgmt => {
      if (asgmt.id > max) {
        max = asgmt.id;
      }
    });
    const lastAsgmt = this.assignments[this.assignments.length - 1];
    lastAsgmt.endDate = new Date(start.getTime() - (24 * 3600000));
    this.assignments[this.assignments.length - 1] = lastAsgmt;

    // create new assignment
    const newAsgmt = new Assignment({
      id: max + 1,
      site: site,
      workcenter: wkctr,
      startDate: new Date(start),
      endDate: new Date(Date.UTC(9999, 11, 31)),
      schedules: []
    });
    // add a new work schedule of seven days with the employee working days (M-F).
    newAsgmt.addSchedule(7);
    for (let d=1; d < 6; d++) {
      newAsgmt.changeWorkday(0, d, wkctr, 'D', 8.0);
    }
    this.assignments.push(newAsgmt);
  }

  /**
   * This method is used to add a new variation to the employee.  It will determine the
   * new variation's identifier and add that along with site and start date to the new
   * variation.  The variation's enddate will match the start date at this time.
   * @param site A string value for the site identifier.
   * @param start A data value for the start of this variation.
   */
  addVariation(site: string, start: Date) {
    // start by getting and determing the next variation id number.
    let newID = -1;
    this.variations.forEach(vari => {
      if (vari.id > newID) {
        newID = vari.id;
      }
    });
    newID++;
    const newVari = new Variation();
    newVari.id = newID;
    newVari.site = site;
    newVari.startdate = new Date(start);
    newVari.enddate = new Date(start);
    this.variations.push(newVari);
    this.variations.sort((a,b) => a.compareTo(b));
  }

  /**
   * The function will remove a particular assignment from the assignment list
   * @param id The numeric identifier for the assignment to remove.
   */
  removeAssignment(id: number) {
    this.assignments.sort((a,b) => a.compareTo(b));
    let pos = -1;
    for (let a=0; a < this.assignments.length && pos < 0; a++) {
      if (this.assignments[a].id === id) {
        pos = a;
      }
    }
    if (pos === 0) {
      const asgmt = this.assignments[pos];
      const nextAsgmt = this.assignments[pos + 1];
      nextAsgmt.startDate = new Date(asgmt.startDate);
      this.assignments[pos + 1] = nextAsgmt;
      this.assignments.splice(pos, 1);
    } else if (pos === this.assignments.length - 1) {
      if (pos > 0) {
        this.assignments[pos-1].endDate = new Date(Date.UTC(9999, 11,31));
        this.assignments.pop();
      }
    } else {
      this.assignments[pos-1].endDate 
        = new Date(this.assignments[pos+1].startDate.getTime() - (24 * 3600000));
      this.assignments.splice(pos,1);
    }
  }

  /**
   * This function will determine if a labor code (charge number and extension) is the
   * employee's primary code for the date given.
   * @param date The date object used for comparison.
   * @param labor The labor code object to provide the charge number/extension for 
   * comparison.
   * @returns A boolean value for whether or not the labor code is a primary one used
   * by the employee.
   */
  isPrimaryCode(date: Date, labor: EmployeeLaborCode): boolean {
    let answer = false;
    this.assignments.forEach(asgmt => {
      if (asgmt.useAssignment(date)) {
        asgmt.laborcodes.forEach(lc => {
          if (labor.chargenumber.toLowerCase() === lc.chargenumber.toLowerCase()
            && labor.extension.toLowerCase() === lc.extension.toLowerCase()) {
            answer = true;
          }
        });
      }
    });
    return answer;
  }

  /**
   * This function will find out if the employee is assigned a particular labor code
   * @param chargeNumber The string value for the charge number to check for
   * @param extension The string value for the extension to check for.
   * @returns The boolean value for assignment of the charge number/extension.
   */
  hasLaborCode(chargeNumber: string, extension: string): boolean {
    let found = false;
    this.assignments.forEach(asgmt => {
      asgmt.laborcodes.forEach(lc => {
        if (lc.chargenumber.toLowerCase() === chargeNumber.toLowerCase()
          && lc.extension.toLowerCase() === extension.toLowerCase()) {
          found = true;
        }
      });
    });
    return found;
  }

  /**
   * This function will check if the employee is assigned a particular charge number/
   * extension on a particular date.
   * @param date The date object used for the date to check.
   * @param chgNo The string value for the charge number to check for
   * @param extension The string value for the extension to check for.
   * @returns The boolean value for assignment of the charge number/extension.
   */
  hasLaborCodeOnDate(date: Date, chgNo: string, ext: string): boolean {
    let found = false;
    this.assignments.forEach(asgmt => {
      if (asgmt.useAssignment(date)) {
        asgmt.laborcodes.forEach(lc => {
          if (lc.chargenumber.toLowerCase() === chgNo.toLowerCase()
            && lc.extension.toLowerCase() === ext.toLowerCase()) {
            found = true;
          }
        });
      }
    });
    return found;
  }

  /**
   * This function is used to determine a workcenter and shift code for work during a
   * period of time.
   * @param start The date object for the start of the period.
   * @param end The date object for the end of the period.
   * @returns A workday object containing the workcenter and shift code to use for the 
   * period.
   */
  getAssignmentForPeriod(start: Date, end: Date): Workday {
    const assigned = new Map<string, number>();

    start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    end = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

    while (start.getTime() <= end.getTime()) {
      const wd = this.getWorkdayWOLeaves(start);
      if (wd) {
        const label = `${wd.workcenter}-${wd.code}`;
        if (label !== '-') {
          if (assigned.has(label)) {
            let num = assigned.get(label);
            if (num) {
              num++;
              assigned.set(label, num);
            } else {
              assigned.set(label, 1);
            }
          } else {
            assigned.set(label, 1);
          }
        }
      }
      start = new Date(start.getTime() + (24 * 3600000));
    }
    let max = 0;
    let label = '';
    const keys = Array.from(assigned.keys());
    keys.forEach(key => {
      const num = assigned.get(key);
      if (num && num > max) {
        max = num;
        label = key;
      }
    });
    const work = label.split('-');
    return new Workday({
      id: 0,
      workcenter: work[0],
      code: work[1],
      hours: 0.0
    });
  }

  /**
   * This function will retrieve and provide the number of forecasted hours from this
   * employee for a time period and labor code.
   * @param labor The company labor code object for the labor codes to check against
   * @param start The date object for the start of the period
   * @param end The date object for the end of the period
   * @param codes A list of compare code objects used for verifying correct codes and
   * whether or not they are leave codes.
   * @returns A numeric (float) value for the number of hours the employee is forecast.
   */
  getForecastHours(labor: LaborCode, start: Date, end: Date, 
    codes: Map<string, Workcode>): number {
    let answer = 0.0;
    start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    end = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

    // Check for assignment during period
    let found = false;
    
    this.assignments.forEach(asgmt => {
      if (asgmt.useAssignment(start, end, labor)) {
        found = true;
      }
    });
    if (!found) {
      return 0.0
    }

    // check if labor code is applicable during period
    if (!labor.startDate || !labor.endDate
      || labor.endDate.getTime() < start.getTime()
      || labor.startDate.getTime() > end.getTime()) {
      return 0.0
    }

    // determine last worked day from work records
    let lastWorked = new Date(0);
    if (this.work && this.work.length > 0) {
      this.work.sort((a,b) => a.compareTo(b));
      lastWorked = new Date(this.work[this.work.length - 1].dateworked);
    }

    // check leaves for a date greater than lastworked
    this.leaves.sort((a,b) => a.compareTo(b));
    this.leaves.forEach(lv => {
      if (lv.status.toLowerCase() === 'actual' && lv.leavedate.getTime() > lastWorked.getTime()) {
        lastWorked = new Date(lv.leavedate);
      }
    });

    // now step through the days of the period to:
    // 1) see if they had worked any charge numbers during
    //		the period, if working add 0 hours
    // 2) see if they were supposed to be working on this
    //		date, compare workday code to workcodes to ensure
    //		they weren't on leave.  If not on leave, add
    // 		assigned hours.
    let current = new Date(start);
    while (current.getTime() <= end.getTime()) {
      if (current.getTime() > lastWorked.getTime()) {
        const nextday = new Date(current.getTime() + (24 *3600000));
        let hours = this.getWorkedHours(current, nextday);
        if (hours === 0.0) {
          if (current.getTime() >= labor.startDate.getTime() 
            && current.getTime() <= labor.endDate.getTime()) {
            const wd = this.getWorkday(current);
            if (wd && wd.code !== '') {
              codes.forEach(code => {
                if (code.id.toLowerCase() === wd.code.toLowerCase() && !code.isLeave) {
                  this.assignments.forEach(asgmt => {
                    if (asgmt.useAssignment(current, nextday, labor)) {
                      answer += wd.hours;
                    }
                  });
                }
              });
            }
          }
        }
      }
      current = new Date(current.getTime() + (24 * 3600000));
    }
    return answer;
  }

  /**************************************************************************************
   * Work Records section
   **************************************************************************************/

  /**
   * This function will provide the total number of hours of actual work for the period
   * given
   * @param start The date object for the start of the period
   * @param end The date object for the end of the period
   * @param chgno (Optional) The string value for the charge number
   * @param ext (Optional) The string value for the charge number extension
   * @returns The numeric value for the total hours of actual work
   */
  getWorkedHours(start: Date, end: Date, chgno?: string, ext?: string): number {
    start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    end = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
    let answer = 0.0;
    if (this.work) {
      this.work.forEach(wk => {
        if (wk.dateworked.getTime() >= start.getTime() 
          && wk.dateworked.getTime() <= end.getTime()
          && !wk.modtime) {
          if (!chgno) {
            answer += wk.hours;
          } else if (chgno && ext) {
            if (chgno.toLowerCase() === wk.chargenumber.toLowerCase() 
              && ext.toLowerCase() === wk.extension.toLowerCase()) {
              answer += wk.hours;
            }
          }
        }
      });
    }

    return answer;
  }

  /**
   * This function will provide the date for the last work record in the object
   * @returns A date object for the last worked day.
   */
  getLastWorkday(): Date {
    let answer = new Date(0);
    if (this.work && this.work.length > 0) {
      this.work.sort((a,b) => a.compareTo(b));
      const last = this.work[this.work.length - 1]
      answer = new Date(last.dateworked);
    }
    return answer;
  }

  /**
   * This function will provide the number of modified time hours for a period of time.
   * @param start The date object for the start of the period.
   * @param end The date object for the end of the period.
   * @returns The numeric (float) value for the number of hours of modified time.
   */
  getModTime(start: Date, end: Date): number {
    let answer = 0.0;
    this.work?.forEach(wk => {
      if (wk.dateworked.getTime() >= start.getTime()
        && wk.dateworked.getTime() <= end.getTime()
        && wk.modtime) {
        answer += wk.hours;
      }
    });
    return answer;
  }

  hasModTime(start: Date, end: Date): boolean {
    let answer = false;
    this.work?.forEach(wk => {
      if (wk.dateworked.getTime() >= start.getTime()
        && wk.dateworked.getTime() <= end.getTime()
        && wk.modtime) {
        answer = true;
      }
    });
    return answer;
  }

  /**************************************************************************************
   * Leave Balance Section - it provides the employee's starting leave balance and the
   * number of hours provided for the year.
   **************************************************************************************/

  /**
   * This function will add a new leave balance object to the leave balance list.  It will
   * only add a new leave balance object if the object for the year doesn't already exist.
   * @param year The numeric (int) value for the year the balances are for.
   */
  createLeaveBalance(year: number) {
    let found = false;
    let lastAnnual = 0.0;
    let lastCarry = 0.0;
    this.balances.forEach(bal => {
      if (bal.year === year) {
        found = true;
      }
      if (bal.year === year - 1) {
        lastAnnual = bal.annual;
        lastCarry = bal.carryover;
      }
    });
    if (!found) {
      const bal = new AnnualLeave({
        year: year,
        annual: lastAnnual,
        carryover: lastCarry
      });
      if (lastAnnual === 0.0) {
        bal.annual = 100;
      } else {
        let carry = lastAnnual + lastCarry;
        this.leaves.forEach(lv => {
          if (lv.leavedate.getFullYear() === year && lv.code.toLowerCase() === 'v' 
            && lv.status.toLowerCase() === 'actual') {
            carry -= lv.hours;
          }
        });
        bal.carryover = carry;
      }
      this.balances.push(bal);
      this.balances.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function is used to update a leave balance object with a new annual year and
   * carry over amount.
   * @param year The numeric value for the year used as a key value
   * @param annual The numeric value for the employee's annual leave amount in hours.
   * @param carry The numeric value for the number of hours the employee brings forward
   * to this year.
   */
  updateLeaveBalance(year: number, annual: number, carry: number) {
    let found = false;
    for (let lb=0; lb < this.balances.length && !found; lb++) {
      if (this.balances[lb].year === year) {
        this.balances[lb].annual = annual;
        this.balances[lb].carryover = carry;
      }
    }
    if (!found) {
      const lb = new AnnualLeave({
        year: year,
        annual: annual,
        carryover: carry
      });
      this.balances.push(lb);
    }
    this.balances.sort((a,b) => a.compareTo(b));
  }

  /**
   * This function will remove a leave balance from the employee's leave balance list.
   * @param year The numeric value for the year of the leave balance (primary key).
   */
  deleteLeaveBalance(year: number) {
    let found = -1;
    this.balances.forEach((bal, i) => {
      if (bal.year === year) {
        found = i;
      }
    });
    if (found >= 0) {
      this.balances.splice(found, 1);
    }
  }

  /**
   * This is the employee leave section.
   */

  /**
   * This function will add a new leave day to the employee's leave list.  It first checks
   * for a leave on the date and code given and will modify leave's other data.  If not
   * found in the list, it will add the leave to the list, then sort the leaves.
   * @param id The numeric value for the leave, normally zero for new leave
   * @param date The date object to give the date the leave
   * @param code The string value representing the work/leave code for this leave
   * @param status The string value for the status of this leave.
   * @param hours The numeric value for the number of hours (float)
   * @param requestid The string value for the associated request reference, may be an 
   * empty string.
   * @param holCode (Optional) A reference string for the holiday the leave is associated
   * with.
   */
  addLeave(id: number, date: Date, code: string, status: string, hours: number, 
    requestid: string, holCode?: string) {
    let found = false;
    let max = 0;
    date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    this.leaves.forEach((lv, l) => {
      if ((lv.useLeave(date) && lv.code.toLowerCase() === code.toLowerCase())
        || lv.id === id) {
        found = true;
        lv.status = status;
        lv.hours = hours;
        if (lv.requestid === '') {
          lv.requestid = requestid;
        }
        if (holCode && holCode !== '') {
          lv.tagday = holCode;
        }
        this.leaves[l] = lv;
      } else if (lv.id > max) {
        max = lv.id;
      }
    });
    if (!found) {
      const lv = new Leave({
        id: max + 1,
        leavedate: new Date(date),
        code: code,
        hours: hours,
        status: status,
        requestid: requestid,
        used: false,
        tagday: holCode
      });
      this.leaves.push(lv);
      this.leaves.sort((a,b) => a.compareTo(b));
    }
  }
/**
 * This function will update a single field within the leave, based on leave's identifier.
 * @param id The numeric value for the leave.
 * @param field The string value for the associated data member to update
 * @param value The string value for the updated value.
 * @returns The updated leave object.
 */
  updateLeave(id: number, field: string, value: string): Leave | undefined {
    let answer: Leave | undefined = undefined;
    this.leaves.forEach((lv, l) => {
      if (lv.id === id) {
        switch (field.toLowerCase()) {
          case "date":
            const newdate = new Date(Date.parse(value));
            lv.leavedate = newdate;
            break;
          case "code":
            lv.code = value;
            break;
          case "hours":
            lv.hours = Number(value);
            break;
          case 'status':
            lv.status = value;
            break;
          case 'requestid':
            lv.requestid = value;
            break;
          case 'tagday':
            lv.tagday = value;
            break;
        }
      }
      this.leaves[l] = lv;
      this.leaves.sort((a,b) => a.compareTo(b));
      answer = lv;
    });
    return answer;
  }

  /**
   * This function will remove a leave day from the employee's leave list, base on 
   * numeric identifier.
   * @param id numeric value for the identifier.
   */
  deleteLeave(id: number) {
    let found = -1;
    this.leaves.forEach((lv, l) => {
      if (lv.id === id) {
        found = l;
      }
    });
    if (found >= 0) {
      this.leaves.splice(found, 1);
    }
  }

  /**
   * This function will provide a total number of leave hours for a particular period of
   * time (Actual Leave Only)
   * @param start The date object for the start of the time period
   * @param end The date object for the end of the time period
   * @returns numeric (float) value for the total leave hours for the period
   */
  getLeaveHours(start: Date, end: Date) : number {
    let answer = 0.0;
    this.leaves.forEach(lv => {
      if (lv.leavedate.getTime() >= start.getTime() 
        && end.getTime() >= lv.leavedate.getTime()
        && lv.status.toLowerCase() === 'actual') {
        answer += lv.hours;
      }
    });
    return answer;
  }

  /**
   * This function will provide a leave workday with the number of total hours of leave
   * time.
   * @param start The date object for the date to check against
   * @returns A workday object with the leave and hours for the date.
   */
  getLeave(start: Date): Workday {
    const workday = new Workday();
    this.leaves.forEach(lv => {
      if (lv.leavedate.getUTCFullYear() === start.getUTCFullYear()
        && lv.leavedate.getUTCMonth() === start.getUTCMonth()
        && lv.leavedate.getUTCDate() === start.getUTCDate()) {
        if (workday.code === '') {
          workday.code = lv.code;
          workday.hours = lv.hours;
        } else {
          if (workday.hours < lv.hours) {
            workday.code = lv.code;
            workday.hours += lv.hours;
          }
        }
      }
    });
    return workday;
  }

  /**
   * This function will provide a total number of vacation/PTO leave hours for a 
   * particular period of time (Actual Leave Only)
   * @param start The date object for the start of the time period
   * @param end The date object for the end of the time period
   * @returns numeric (float) value for the total leave hours for the period
   */
  getPTOHours(start: Date, end: Date) : number {
    let answer = 0.0;
    this.leaves.forEach(lv => {
      if (lv.leavedate.getTime() >= start.getTime() 
        && end.getTime() >= lv.leavedate.getTime()
        && lv.status.toLowerCase() === 'actual'
        && lv.code.toLowerCase() === 'v') {
        answer += lv.hours;
      }
    });
    return answer;
  }

  /** 
   * This will be the Leave Request section
   */

  /**
   * This function will create a new leave request for the employee
   * @param start The date object for the start of the leave request period
   * @param end The date object for the end of the leave request period
   * @param code the string value for the code to the primary leave type to use
   * @param comment The string vlue for any comment to use
   * @returns The new leave request object or undefined if not created.
   */
  createLeaveRequest(start: Date, end: Date, code: string, comment: string)
    : LeaveRequest | undefined {
    start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    end = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
    // first check to see if the period is covered by a current leave request and return
    // this object.  if The comment is not empty, add it to the request.
    let answer: LeaveRequest | undefined = undefined;
    this.requests.forEach((req, r) => {
      if (req.startdate.getTime() === start.getTime() 
        && req.enddate.getTime() === end.getTime()) {
        if (comment !== '') {
          const cmt = new LeaveRequestComment({
            commentdate: new Date(),
            comment: comment
          });
          req.comments.push(cmt);
          req.comments.sort((a,b) => a.compareTo(b));
        }
        answer = new LeaveRequest(req);
      }
    });

    // if not found, create a new leave request
    if (!answer) {
      const id = new ObjectId().toString();
      answer = new LeaveRequest({
        id: id,
        employeeid: this.id,
        requestdate: new Date(),
        primarycode: code,
        startdate: start,
        enddate: end,
        status: 'DRAFT',
        approvalDate: new Date(0),
        approvedby: '',
        requesteddays: [],
        comments: []
      });
      answer.comments.push(new LeaveRequestComment({
        commentdate: new Date(),
        comment: 'Request Created'
      }));
      if (comment !== '') {
        answer.comments.push(new LeaveRequestComment({
          commentdate: new Date(),
          comment: comment
        }));
      }
      answer.setLeaveDays(this);
      this.requests.push(new LeaveRequest(answer));
    }

    return answer;
  }

  /**
   * This function is used to update a leave request of the employee, by identifier,
   * field to update and the value to update to.
   * @param id The string value representing the identifier 
   * @param field The string value for the field to update.
   * @param value The string value to use in the update.
   * @returns An interface of the consisting of a email message, leave request, and an
   * error message.
   */
  updateLeaveRequest(id: string, field: string, value: string)
    : ChangeLeaveRequestResponse {
    const answer: ChangeLeaveRequestResponse = {
      message: '',
      leaverequest: undefined,
      error: undefined
    }
    this.requests.forEach((req, r) => {
      if (req.useRequest(id)) {
        switch (field.toLowerCase()) {
          case "startdate":
          case "start":
            // parse the value to make a date object, then make sure the date is a UTC
            // value
            let date = new Date(Date.parse(value))
            date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

            // check to see if the dates are outside the original start and end dates, 
            // which invalidates the leave request and places back in the draft status
            // and removes any current approved leaves to be removed.
            if (date.getTime() < req.startdate.getTime() 
              || date.getTime() > req.enddate.getTime()) {
              if (req.status.toLowerCase() === 'approved') {
                // remove the approved leaves from the leaves list.
                this.leaves.sort((a,b) => a.compareTo(b));
                let count = 0;
                let startpos = -1;
                this.leaves.forEach((lv, l) => {
                  if (lv.requestid === id && lv.status.toLowerCase() !== 'actual') {
                    if (startpos < 0) {
                      startpos = l;
                      count++;
                    } else {
                      count++;
                    }
                  }
                });
                if (startpos >= 0) {
                  this.leaves.splice(startpos, count);
                }
              }
              req.status = 'DRAFT';
              req.approvalDate = new Date(0);
              req.approvedby = '';
            } else {
              if (req.status.toLowerCase() === 'approved') {
                // remove approved leaves from before the new date that have the 
                // request identifier
                this.leaves.sort((a,b) => a.compareTo(b));
                let count = 0;
                let startpos = -1;
                this.leaves.forEach((lv, l) => {
                  if (lv.requestid === id && lv.status.toLowerCase() !== 'actual'
                    && lv.leavedate.getTime() < date.getTime()) {
                    if (startpos < 0) {
                      startpos = l;
                      count++;
                    } else {
                      count++
                    }
                  }
                });
                if (startpos >= 0 && count > 0) {
                  this.leaves.splice(startpos, count);
                }
              }
            }
            req.startdate = new Date(date);
            req.setLeaveDays(this);
            req.comments.push(new LeaveRequestComment({
              commentdate: new Date(),
              comment: `Start date for request was changed to ${date.toDateString()}`
            }));
            req.comments.sort((a,b) => a.compareTo(b));
            break;
          case "enddate":
          case "end":
            // parse the value to make a date object, then make sure the date is a UTC
            // value
            date = new Date(Date.parse(value))
            date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

            // check to see if the dates are outside the original start and end dates, 
            // which invalidates the leave request and places back in the draft status
            // and removes any current approved leaves to be removed.
            if (date.getTime() < req.startdate.getTime() 
              || date.getTime() > req.enddate.getTime()) {
              if (req.status.toLowerCase() === 'approved') {
                // remove the approved leaves from the leaves list.
                this.leaves.sort((a,b) => a.compareTo(b));
                let count = 0;
                let startpos = -1;
                this.leaves.forEach((lv, l) => {
                  if (lv.requestid === id && lv.status.toLowerCase() !== 'actual') {
                    if (startpos < 0) {
                      startpos = l;
                      count++;
                    } else {
                      count++;
                    }
                  }
                });
                if (startpos >= 0) {
                  this.leaves.splice(startpos, count);
                }
              }
              req.status = 'DRAFT';
              req.approvalDate = new Date(0);
              req.approvedby = '';
            } else {
              if (req.status.toLowerCase() === 'approved') {
                // remove approved leaves from before the new date that have the 
                // request identifier
                this.leaves.sort((a,b) => a.compareTo(b));
                let count = 0;
                let startpos = -1;
                this.leaves.forEach((lv, l) => {
                  if (lv.requestid === id && lv.status.toLowerCase() !== 'actual'
                    && lv.leavedate.getTime() > date.getTime()) {
                    if (startpos < 0) {
                      startpos = l;
                      count++;
                    } else {
                      count++
                    }
                  }
                });
                if (startpos >= 0 && count > 0) {
                  this.leaves.splice(startpos, count);
                }
              }
            }
            req.enddate = new Date(date);
            req.setLeaveDays(this);
            req.comments.push(new LeaveRequestComment({
              commentdate: new Date(),
              comment: `End date for request was changed to ${date.toDateString()}`
            }));
            req.comments.sort((a,b) => a.compareTo(b));
            break;
          case 'dates':
            const values = value.split('|');
            // parse the value to make a date object, then make sure the date is a UTC
            // value
            let newstart = new Date(Date.parse(values[0]))
            newstart = new Date(Date.UTC(newstart.getFullYear(), newstart.getMonth(), 
              newstart.getDate()));
            let newend = new Date(Date.parse(values[1]))
            newend = new Date(Date.UTC(newend.getFullYear(), newend.getMonth(), 
              newend.getDate()));

            // check to see if the dates are outside the original start and end dates, 
            // which invalidates the leave request and places back in the draft status
            // and removes any current approved leaves to be removed.
            if (newstart.getTime() < req.startdate.getTime() 
              || newstart.getTime() > req.enddate.getTime()
              || newend.getTime() < req.startdate.getTime()
              || newend.getTime() > req.enddate.getTime()) {
              if (req.status.toLowerCase() === 'approved') {
                // remove the approved leaves from the leaves list.
                this.leaves.sort((a,b) => a.compareTo(b));
                let count = 0;
                let startpos = -1;
                this.leaves.forEach((lv, l) => {
                  if (lv.requestid === id && lv.status.toLowerCase() !== 'actual') {
                    if (startpos < 0) {
                      startpos = l;
                      count++;
                    } else {
                      count++;
                    }
                  }
                });
                if (startpos >= 0) {
                  this.leaves.splice(startpos, count);
                }
              }
              req.status = 'DRAFT';
              req.approvalDate = new Date(0);
              req.approvedby = '';
            } else {
              if (req.status.toLowerCase() === 'approved') {
                // remove approved leaves from before the new date that have the 
                // request identifier
                this.leaves.sort((a,b) => a.compareTo(b));
                let startcount = 0;
                let startpos = -1;
                let endcount = 0;
                let endpos = -1;
                this.leaves.forEach((lv, l) => {
                  if (lv.requestid === id && lv.status.toLowerCase() !== 'actual'
                    && lv.leavedate.getTime() < newstart.getTime()) {
                    if (startpos < 0) {
                      startpos = l;
                      startcount++;
                    } else {
                      startcount++
                    }
                  } else if (lv.requestid === id && lv.status.toLowerCase() !== 'actual'
                    && lv.leavedate.getTime() > newend.getTime()) {
                    if (endpos < 0) {
                      endpos = l;
                      endcount++;
                    } else {
                      endcount++;
                    }
                  }
                });
                if (startpos >= 0 && endcount > 0) {
                  this.leaves.splice(startpos, startcount);
                }
                if (endpos >= 0 && endcount > 0) {
                  this.leaves.splice(endpos, endcount);
                }
              }
            }
            req.startdate = new Date(newstart);
            req.enddate = new Date(newend);
            req.setLeaveDays(this);
            req.comments.push(new LeaveRequestComment({
              commentdate: new Date(),
              comment: `Request dates for request were changed to `
                + `${newstart.toDateString()} - ${newend.toDateString()}`
            }));
            req.comments.sort((a,b) => a.compareTo(b));
            break;
          case "code":
          case "primarycode":
            req.primarycode = value;
            req.setLeaveDays(this, true);
            req.comments.push(new LeaveRequestComment({
              commentdate: new Date(),
              comment: `Primary Code for request was changed to ${value}`
            }));
            req.comments.sort((a,b) => a.compareTo(b));
            break;
          case "requested":
            req.status = 'REQUESTED';
            req.requesteddays.forEach((lv, l) => {
              if (lv.code !== '') {
                lv.status = 'REQUESTED';
                req.requesteddays[l] = lv;
              }
            });
            req.comments.push(new LeaveRequestComment({
              commentdate: new Date(),
              comment: 'Leave request was submitted for approval.'
            }));
            req.comments.sort((a,b) => a.compareTo(b));
            answer.message = `Leave Request from ${this.name.getLastFirst()} `
              + `submitted for approval.  Requested leave dates: `
              + `${req.startdate.toDateString()} - ${req.enddate.toDateString()}.`;
            break;
          case "unapprove":
            req.approvedby = '';
            req.approvalDate = new Date(0);
            req.status = 'DRAFT';
            req.requesteddays.forEach((lv, l) => {
              if (lv.code !== '') {
                lv.status = 'REQUESTED';
                req.requesteddays[l] = lv;
              }
            });
            req.comments.push(new LeaveRequestComment({
              commentdate: new Date(),
              comment: value
            }));
            req.comments.sort((a,b) => a.compareTo(b));
            break;
          case 'day':
          case 'requestday':
            const bApproved = req.status.toLowerCase() === 'approved';
            let found = false;
            let max = 0;
            const svalues = value.split('|');
            let lvDate = new Date(Date.parse(svalues[0]));
            let code = svalues[1];
            let hours = Number(svalues[2]);
            let status = '';
            let workcenter = '';
            if (svalues.length > 3) {
              workcenter = svalues[3];
            }
            req.requesteddays.forEach((lv, l) => {
              if (lv.useLeave(lvDate)) {
                found = true;
                lv.code = code;
                if (status == '') {
                  status = lv.status;
                }
                lv.status = workcenter;
                if (code == '') {
                  lv.hours = 0.0;
                } else {
                  lv.hours = hours;
                }
                req.requesteddays[l] = lv;
              }
              if (max < lv.id) {
                max = lv.id;
              }
            });
            if (!found) {
              const lv = new Leave({
                id: max + 1,
                leavedate: new Date(lvDate),
                code: code,
                hours: hours,
                status: status,
                requestid: req.id,
                used: false
              });
              req.requesteddays.push(lv);
              req.requesteddays.sort((a,b) => a.compareTo(b));
            }
            if (bApproved) {
              found = false;
              this.leaves.forEach((lv, l) => {
                if (lv.useLeave(lvDate)) {
                  found = true;
                  lv.code = code;
                  if (code === '') {
                    lv.hours = 0.0;
                  } else {
                    lv.hours = hours;
                  }
                  this.leaves[l] = lv;
                }
              });
              if (!found && code !== '') {
                this.leaves.push(new Leave({
                  id: max + 1,
                  leavedate: new Date(lvDate),
                  code: code,
                  hours: hours,
                  status: req.status,
                  requestid: req.id,
                  used: false
                }));
              }
            }
            req.comments.push(new LeaveRequestComment({
              commentdate: new Date(),
              comment: `Requested Days Updated: ${lvDate.toDateString()} to Code: ${code}, `
                + `hours: ${hours}`
            }));
          case "comment":
          case "addcomment":
            req.comments.push(new LeaveRequestComment({
              commentdate: new Date(),
              comment: value
            }));
            req.comments.sort((a,b) => a.compareTo(b));
            break;
        }
        answer.leaverequest = req;
      }
    });

    return answer;
  }

  /**
   * This function is used to approve a requested leave request.  When approved it updates
   * the leave list of the employee, plus if the request is a mod time request, it creates
   * the variation for the mod time.
   * @param id The string value for the identifier for the leave request.
   * @param approver The string value for the identifier for the employee who approved 
   * this request. 
   * @param leavecodes A list of workcode associated with types of leaves.
   * @returns A change leave request response containing any message to email and this
   * leave request.
   */
  approveLeaveRequest(id: string, approver: string, leavecodes: Workcode[])
    : ChangeLeaveRequestResponse {
    const answer: ChangeLeaveRequestResponse = {
      message: '',
      leaverequest: undefined,
      error: undefined
    };
    this.requests.forEach((req, r) => {
      if (req.id === id) {
        req.approvalDate = new Date();
        req.approvedby = approver;
        req.status = 'Approved';
        let max = 0;
        this.removeLeaves(req.startdate, req.enddate, req.id, false);
        this.leaves.forEach(lv => {
          if (max < lv.id) {
            max = lv.id;
          }
        });

        if (req.primarycode.toLowerCase() !== 'mod') {
          req.requesteddays.forEach((day, d) => {
            if (day.code !== '') {
              max++;
              day.status = 'Approved';
              req.requesteddays[d] = day;
              this.leaves.push(new Leave({
                id: max,
                leavedate: new Date(day.leavedate),
                code: day.code,
                hours: day.hours,
                status: day.status,
                requestid: req.id,
                used: false
              }));
            }
          })
          answer.message = `Leave Request was approved for period of `
            + `${req.startdate.toDateString()} - ${req.enddate.toDateString()}.`;
          answer.leaverequest = req;
        } else {
          // a mod time request will create a variation rather than leave objects

          // check if there is a variation for this period first and modify it 
          let found = false;
          this.variations.forEach((vari, v) => {
            if (vari.startdate.getTime() === req.startdate.getTime() 
              && vari.enddate.getTime() === req.enddate.getTime()
              && vari.mod) {
              found = true;
              let start = new Date(req.startdate);
              while (start.getDay() !== 0) {
                start = new Date(start.getTime() - (24 * 3600000));
              }
              vari.setScheduleDays()
              let lastcode = '';
              let workcenter = '';
              req.requesteddays.forEach(day => {
                let isLeave = false;
                leavecodes.forEach(wc => {
                  if (wc.id.toLowerCase() === day.code.toLowerCase() && wc.isLeave) {
                    isLeave = true;
                  }
                });
                if (isLeave) {
                  max++;
                  this.leaves.push(new Leave({
                    id: max,
                    leavedate: new Date(day.leavedate),
                    code: day.code,
                    hours: day.hours,
                    status: 'APPROVED',
                    requestid: req.id,
                    used: false
                  }));
                  this.leaves.sort((a,b) => a.compareTo(b));
                } else {
                  lastcode = day.code;
                  workcenter = day.status;
                }
                const dos = Math.floor((day.leavedate.getTime() - start.getTime()) 
                  / (24 * 3600000));
                vari.schedule.workdays[dos].code = lastcode;
                vari.schedule.workdays[dos].hours = day.hours;
                vari.schedule.workdays[dos].workcenter = workcenter;
              });
            }
          });

          // if no variation, add a new one.
          if (!found) {
            let max = 0;
            this.variations.forEach(vari => {
              if (max < vari.id) {
                max = vari.id;
              }
            });
            const vari = new Variation({
              id: max + 1,
              mids: false,
              mod: true,
              startdate: new Date(req.startdate),
              enddate: new Date(req.enddate),
              site: this.site,
              schedule: new Schedule()
            });
            vari.setScheduleDays();
            vari.schedule.showdates = true;
            req.requesteddays.forEach(day => {
              vari.updateWorkdayByDate
            });
          }
        }
      }
    });
    return answer;
  }

  /**
   * This function will remove a leave request from the employee's list, plus if the
   * request has an approved status, it will remove any associated leaves and variations.
   * @param id The string value for the identifier for the leave request.
   */
  deleteLeaveRequest(id: string) {
    let req = this.requests.find(r => r.id === id);
    if (req) {
      if (req.status.toLowerCase() === 'approved') {
        let pos = this.leaves.findIndex(l => l.requestid === id);
        while (pos >= 0) {
          this.leaves.splice(pos, 1);
          pos = this.leaves.findIndex(l => l.requestid === id);
        }

        if (req.primarycode.toLowerCase() === 'mod') {
          pos = this.variations.findIndex(v => (
            v.mod && v.startdate.getTime() === req.startdate.getTime()
            && v.enddate.getTime() === req.enddate.getTime()));
          if (pos >= 0) {
            this.variations.splice(pos, 1);
          }
        }
      }
      let pos = this.requests.findIndex(r => r.id === id);
      if (pos >= 0) {
        this.requests.splice(pos, 1);
      }
    }
  }

  /***************************************************************************************
   * Employee's contact information section
   **************************************************************************************/

  /**
   * This function will either add a new contact information or update one with the
   * provided type id.
   * @param typeid The numeric value for the type of contact information corresponding
   * to the team's contact information types.
   * @param value The string value for the contact information value
   * @param sortid The numeric value for the sort order for this object, gotten from the
   * team's contact information types.
   */
  addContactInfo(typeid: number, value: string, sortid: number): void {
    let found = false;
    let next = -1;
    this.contactinfo.forEach((ci, c) => {
      if (ci.id > next) next = ci.id;
      if (ci.typeid === typeid) {
        found = true;
        ci.value = value;
        this.contactinfo[c] = ci;
      }
    });
    if (!found) {
      const contact = new Contact({
        id: next + 1,
        typeid: typeid,
        value: value,
        sort: sortid
      });
      this.contactinfo.push(contact);
      this.contactinfo.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function will re-sort the employee's contact information based on the team's
   * contact information types' sort order.
   * @param teamcontacts A map of the team's contact information types sort order.
   */
  resortContactInfo(teamcontacts: Map<number, number>) {
    this.contactinfo.forEach((ci, c) => {
      const tc = teamcontacts.get(ci.typeid);
      ci.sort = (tc) ? tc : 0;
      this.contactinfo[c] = ci;
    });
    this.contactinfo.sort((a,b) => a.compareTo(b));
  }

  /**
   * This function will remove an employee's contact information by type id.
   * @param type The numeric value for the type of contact information to remove.
   */
  deleteContactInfoByType(type: number) {
    let found = -1;
    this.contactinfo.forEach((ci, c) => {
      if (ci.typeid === type) {
        found = c;
      }
    });
    if (found >= 0) {
      this.contactinfo.splice(found, 1);
    }
  }

  /**
   * This function will remove an employee's contact information by identifier.
   * @param id The numeric value for the identifier for the contact info.
   */
  deleteContactInfo(id: number) {
    let found = -1;
    this.contactinfo.forEach((ci, c) => {
      if (ci.id === id) {
        found = c;
      }
    });
    if (found >= 0) {
      this.contactinfo.splice(found, 1);
    }
  }

  /**
   * This function is used to update for add a specialty to the employee's list.
   * @param specid numeric value for the specialty identifier from the team's specialty
   * list.
   * @param qualified boolean value to signify if the employee is qualified in it
   * @param sort numeric value for the sort position, copied from the team's specialty 
   * list.
   */
  addSpecialty(specid: number, qualified: boolean, sort: number) {
    let found = false;
    let next = -1;
    this.specialties.forEach((spc, s) => {
      if (spc.id > next) next = spc.id;
      if (spc.specialtyid === specid) {
        found = true;
        spc.qualified = qualified;
        this.specialties[s] = spc;
      }
    });
    if (!found) {
      const spc = new Specialty({
        id: next + 1,
        specialtyid: specid,
        qualified: qualified,
        sort: sort
      });
      this.specialties.push(spc);
      this.specialties.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function will reassign the employee's specialties with the sort values for the
   * team specialties, then re-sort them.
   * @param teamspecs The Map of the team specialties sort number by specialty id.
   */
  resortSpecialties(teamspecs: Map<number, number>) {
    this.specialties.forEach((spc, s) => {
      const ts = teamspecs.get(spc.specialtyid);
      spc.sort = (ts) ? ts : 0;
      this.specialties[s] = spc;
    });
    this.specialties.sort((a,b) => a.compareTo(b));
  }

  /**
   * This function will remove an employee's specialty by identifier.
   * @param id The numeric value for the employee's specialty identifier.
   */
  deleteSpecialty(id: number) {
    let found = -1;
    this.specialties.forEach((spc, s) => {
      if (spc.id === id) {
        found = s;
      }
    });
    if (found >= 0) {
      this.specialties.splice(found, 1);
    }
    this.specialties.sort((a,b) => a.compareTo(b));
  }
  
  /**
   * This function will remove an employee's specialty by specialty type
   * @param type The numeric value associated with the team's specialty identifer.
   */
  deleteSpecialtyByType(type: number) {
    let found = -1;
    this.specialties.forEach((spc, s) => {
      if (spc.specialtyid === type) {
        found = s;
      }
    });
    if (found >= 0) {
      this.specialties.splice(found, 1);
    }
    this.specialties.sort((a,b) => a.compareTo(b));
  }

  /**
   * This function will provide a boolean answer as to whether the employee is qualified
   * in a particular specialty skill.
   * @param spec The numeric value for the specialty to search for.
   * @returns boolean value for the employee's qualified to this skill.
   */
  hasSpecialty(spec: number): boolean {
    let answer = false;
    this.specialties.forEach(spc => {
      if (spc.specialtyid === spec) {
        answer = true;
      }
    });
    return answer;
  }
}