import { ILeave, Leave } from "./leave";
import { Employee } from "./employee";

/**
 * The leave request is the record an employee uses to request a leave period with their
 * supervisor.  It includes comments and proposed leave days.
 */

/**
 * The interface describes a comment to a leave request.
 */
export interface ILeaveRequestComment {
  commentdate: Date;
  comment: string;
}

/**
 * The class description for a comment to a leave request.  The data members are:
 * comment date (date object for the date the comment was written on.)
 * comment (the string value for the actual comment to the request)
 */
export class LeaveRequestComment implements ILeaveRequestComment {
  public commentdate: Date;
  public comment: string;

  constructor(cmt?: ILeaveRequestComment) {
    this.commentdate = (cmt) ? new Date(cmt.commentdate) : new Date();
    this.comment = (cmt) ? cmt.comment : '';
  }

  /**
   * This function is used to sort the comments by date.
   * @param other The comment object used in comparison.
   * @returns 

  /**
   * This function is used to sort this object from another variation object
   * @param other The other variation object for comparison
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before or 1 for after.
   */
  compareTo(other?: LeaveRequestComment): number {
    if (other) {
      return this.commentdate.getTime() < other.commentdate.getTime() ? -1 : 1;
    }
    return -1;
  }
}

/**
 * This interface describes a leave request.
 */
export interface ILeaveRequest {
  id: string;
  employeeid: string;
  requestdate: Date;
  primarycode: string;
  startdate: Date;
  enddate: Date;
  status: string;
  approvedby: string;
  approvalDate: Date;
  requesteddays: ILeave[];
  comments?: ILeaveRequestComment[];
}

/**
 * This class describes a leave request object.  The data members are:
 * id (string value representing a mongo db object identifier)
 * employeeid (string value representing a mongo db object identifier for the employee)
 * requestdate (the date object for the date the request was created)
 * primarycode (string value for the leave code used the most in the request)
 * startdate (the date object used to define the begining of the leave period)
 * enddate (the date object used to define the end of the leave period)
 * status (the string value for the step the request is in the approval process.  The 
 * available statuses are DRAFT, REQUESTED, APPROVED)
 * approvedby (the string value representing the object id of the supervisor approving
 * the request)
 * approvaldate (the date object for the date the request was approved)
 * requesteddays (the list of proposed leave days within the period)
 * comments (the list of comments to this request)
 */
export class LeaveRequest implements ILeaveRequest {
  public id: string;
  public employeeid: string;
  public requestdate: Date;
  public primarycode: string;
  public startdate: Date;
  public enddate: Date;
  public status: string;
  public approvedby: string;
  public approvalDate: Date;
  public requesteddays: Leave[];
  public comments: LeaveRequestComment[];

  constructor(req?: ILeaveRequest) {
    this.id = (req) ? req.id : '';
    this.employeeid = (req) ? req.employeeid : '';
    this.requestdate = (req) ? new Date(req.requestdate) : new Date();
    this.primarycode = (req) ? req.primarycode : 'V';
    this.startdate = (req) ? new Date(req.startdate) : new Date();
    this.enddate = (req) ? new Date(req.enddate) : new Date();
    this.status = (req) ? req.status : 'REQUESTED';
    this.approvedby = (req) ? req.approvedby : '';
    this.approvalDate = (req) ? new Date(req.approvalDate) : new Date(0);
    this.requesteddays = [];
    if (req && req.requesteddays && req.requesteddays.length > 0) {
      req.requesteddays.forEach(day => {
        this.requesteddays.push(new Leave(day));
      });
      this.requesteddays.sort((a,b) => a.compareTo(b));
    } else {
      const first = new Date(Date.UTC(this.startdate.getFullYear(), 
        this.startdate.getMonth(), this.startdate.getDate()));
      const leave = new Leave();
      leave.leavedate = first;
      leave.code = 'V';
      leave.requestid = this.id;
      this.requesteddays.push(leave);
    }
    this.comments = [];
    if (req && req.comments && req.comments.length > 0) {
      req.comments.forEach(cmt => {
        this.comments?.push(new LeaveRequestComment(cmt));
      });
      this.comments.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * this function is used to sort this request from another.  They are sorted based on
   * start, end and request dates.
   * @param other The request object used for comparison.
   * @returns A numeric value to indicate whether this object is before or after the other
   * object.  -1 is before or 1 for after.
   */
  compareTo(other?: LeaveRequest): number {
    if (other) {
      if (this.startdate.getTime() === other.startdate.getTime()) {
        if (this.enddate.getTime() === other.enddate.getTime()) {
          return (this.requestdate.getTime() < other.requestdate.getTime()) ? -1 : 1;
        }
        return (this.enddate.getTime() < other.enddate.getTime()) ? -1 : 1;
      }
      return (this.startdate.getTime() < other.startdate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  useRequest(id: string): boolean {
    return this.id.toLowerCase() === id.toLowerCase();
  }

  /**
   * This function is used to replace a value on a single proposed leave day.
   * @param date The date object used to find which leave day to update
   * @param field The string value for which field in the leave day to update.
   * @param value The string value for the change.  If can me a string value of a number
   * or boolean value.
   */
  updateLeaveDay(date: Date, field: string, value: string) {
    let lDate = new Date(date);
    lDate = new Date(Date.UTC(lDate.getUTCFullYear(), 
      lDate.getUTCMonth(), lDate.getUTCDate()));
    for (let d=0; d < this.requesteddays.length; d++) {
      const lv = this.requesteddays[d];
      if (lv.useLeave(lDate)) {
        switch (field.toLowerCase()) {
          case "code":
            lv.code = value;
            break;
          case "hours":
            lv.hours = Number(value);
            break;
          case "status":
            lv.status = value;
            break;
          case "used":
            lv.used = Boolean(value);
            break;
          case "tag":
          case "tagday":
            lv.tagday = value;
            break;
        }
        this.requesteddays[d] = lv;
      }
    }
  }

  /**
   * This function is used to set up leave days in the request object based on the
   * period and whether or not the employee normally works the day.
   * @param emp This a reference to the employee object where this request resides and 
   * is used to determine if the employee normally works on that day.
   */
  setLeaveDays(emp: Employee, reset: boolean = false) {
    let start = new Date(Date.UTC(this.startdate.getFullYear(), this.startdate.getMonth(),
      this.startdate.getDate()));
    const olddays: Leave[] = [];
    this.requesteddays.forEach(lv => {
      olddays.push(new Leave(lv));
    });
    this.requesteddays = [];
    let count = -1;
    while (start.getTime() < this.enddate.getTime()) {
      const wd = emp.getWorkday(start);
      let leave: Leave | undefined = undefined;
      if (wd && wd.code !== '') {
        if (this.primarycode.toLowerCase() === 'mod') {
          leave = new Leave({
            id: count++,
            leavedate: new Date(start),
            code: wd.code,
            hours: wd.hours,
            status: 'REQUESTED',
            requestid: this.id,
            used: false
          });
        } else {
          let stdHours = emp.getStandardWorkday(start);
          if (this.primarycode.toLowerCase() === 'h') {
            stdHours = 8.0;
          }
          leave = new Leave({
            id: count++,
            leavedate: new Date(start),
            code: this.primarycode,
            hours: stdHours,
            status: 'REQUESTED',
            requestid: this.id,
            used: false
          });
        }
      } else {
        leave = new Leave({
          id: count++,
          leavedate: new Date(start),
          code: '',
          hours: 0.0,
          status: 'REQUESTED',
          requestid: this.id,
          used: false
        });
      }
      if (!reset) {
        olddays.forEach(olv => {
          if (olv.useLeave(start)) {
            leave.code = olv.code;
            leave.hours = olv.hours;
            leave.status = this.status;
            leave.tagday = olv.tagday;
          }
        });
      }
      this.requesteddays.push(leave);
      start = new Date(start.getTime() + (24 * 3600000));
    }
    this.requesteddays.sort((a,b) => a.compareTo(b));
  }
}