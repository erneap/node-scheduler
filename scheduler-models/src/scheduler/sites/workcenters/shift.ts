import { Employee } from "../../employees";

/**
 * This interface defines the data members associated with a shift
 */
export interface IShift {
  id: string;
  name: string;
  sort: number;
  associatedCodes: string[];
  payCode: number;
  minimums: number;
}

/**
 * This class definition implements the basic shift object plus actions.
 */
export class Shift implements IShift {
  public id: string;
  public name: string;
  public sort: number;
  public associatedCodes: string[];
  public payCode: number;
  public minimums: number;
  public employees?: Employee[];

  constructor(shft?: IShift) {
    this.id = (shft) ? shft.id : '';
    this.name = (shft) ? shft.name : '';
    this.sort = (shft) ? shft.sort : 0;
    this.associatedCodes = [];
    if (shft) {
      shft.associatedCodes.forEach(code => {
        this.associatedCodes.push(code);
      });
      this.associatedCodes.sort();
    }
    this.payCode = (shft) ? shft.payCode : 1;
    this.minimums = (shft) ? shft.minimums : 1;
  }

  /**
   * This function will be used to sort this shift with others.
   * @param other A Shift object to compare against
   * @returns A numeric value for the relative position to the other.
   */
  compareTo(other?: Shift): number {
    if (other) {
      return (this.sort < other.sort) ? -1 : 1;
    }
    return -1;
  }

  belowMinimums(): boolean {
    if (this.employees) {
      return this.employees.length < this.minimums;
    } 
    return (this.minimums > 0);
  }
}