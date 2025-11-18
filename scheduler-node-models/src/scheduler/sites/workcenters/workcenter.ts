import { Employee } from "../../employees";
import { IPosition, Position } from "./position";
import { IShift, Shift } from "./shift";

/**
 * This interface will define a workcenter.
 */
export interface IWorkcenter {
  id: string;
  name: string;
  sort: number;
  shifts?: IShift[];
  positions?: IPosition[];
}

/**
 * This class defines a workcenter with its data members and actions
 */
export class Workcenter implements IWorkcenter {
  public id: string;
  public name: string;
  public sort: number;
  public shifts?: Shift[];
  public positions?: Position[];

  constructor(wc?: IWorkcenter) {
    this.id = (wc) ? wc.id : '';
    this.name = (wc) ? wc.name : '';
    this.sort = (wc) ? wc.sort : 0;
    if (wc && wc.shifts && wc.shifts.length > 0) {
      this.shifts = [];
      wc.shifts.forEach(shft => {
        if (this.shifts) {
          this.shifts.push(new Shift(shft));
        }
      });
      this.shifts.sort((a,b) => a.compareTo(b));
    }
    if (wc && wc.positions && wc.positions.length > 0) {
      this.positions = [];
      wc.positions.forEach(pos => {
        this.positions?.push(new Position(pos));
      });
      this.positions.sort((a,b) => a.compareTo(b));
    }
  }

  /**
   * This function is used to sort this workcenter in relation to another
   * @param other The workcenter object used in comparison.
   * @returns A numeric value for the relative position between two workcenters.
   */
  compareTo(other?: Workcenter): number {
    if (other) {
      return (this.sort < other.sort) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function will be used to assign the employee to either a position or a shift
   * based the positions assignment list or their workday code.
   * @param emp The employee object to assign to one of the workcenter's postions or 
   * shifts.
   * @param date The date object to used to find the employee's workday.
   */
  assign(emp: Employee, date: Date) {
    // first check to see if the employee is assigned to a position
    let bPosition = false;
    if (this.positions) {
      this.positions.forEach((pos, p) => {
        pos.assigned.forEach(asgn => {
          if (emp.id === asgn) {
            bPosition = true;
            if (!pos.employees) {
              pos.employees = [];
              pos.employees.push(new Employee(emp));
            } else {
              pos.employees.push(new Employee(emp));
              pos.employees.sort((a,b) => a.compareTo(b));
            }
          }
        });
        if (bPosition && this.positions) {
          this.positions[p] = pos;
        }
      });
    }
    // if not assigned to a position, find their shift and assign to a shift.
    if (!bPosition && this.shifts) {
      let wd = emp.getWorkday(date);
      this.shifts.forEach((shft, s) => {
        shft.associatedCodes.forEach(cd => {
          if (cd.toLowerCase() === wd?.code.toLowerCase()) {
            if (!shft.employees) {
              shft.employees = [];
              shft.employees.push(new Employee(emp));
            } else {
              shft.employees.push(new Employee(emp));
              shft.employees.sort((a,b) => a.compareTo(b));
            }
          }
        });
        if (this.shifts) {
          this.shifts[s] = shft;
        }
      });
    }
  }

  /**
   * This function will clear the employees' lists from the workcenter positions and
   * shifts.
   */
  clearEmployees() {
    if (this.positions) {
      this.positions.forEach((pos, p) => {
        pos.employees = undefined;
        if (this.positions) {
          this.positions[p] = pos;
        }
      });
    }
    if (this.shifts) {
      this.shifts.forEach((shft, s) => {
        shft.employees = undefined;
        if (this.shifts) {
          this.shifts[s] = shft;
        }
      })
    }
  }
}