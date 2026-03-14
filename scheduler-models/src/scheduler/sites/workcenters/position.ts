import { Employee } from "../../employees";

/**
 * This interface defines the data members for a duty position
 */
export interface IPosition {
  id: string;
  name: string;
  sort: number;
  assigned: string[];
}

/**
 * This class implements the basic duty position definition plus actions.
 */
export class Position implements IPosition {
  public id: string;
  public name: string;
  public sort: number;
  public assigned: string[];
  public employees?: Employee[];

  constructor(pos?: IPosition) {
    this.id = (pos) ? pos.id : '';
    this.name = (pos) ? pos.name : '';
    this.sort = (pos) ? pos.sort : 0;
    this.assigned = [];
    if (pos) {
      pos.assigned.forEach(emp => {
        this.assigned.push(emp);
      });
    }
  }

  /**
   * This function will be used to sort duty positions within a list
   * @param other A position object to compare against this one.
   * @returns A numeric value for its relative position to the other.
   */
  compareTo(other?: Position): number {
    if (other) {
      return (this.sort < other.sort) ? -1 : 1;
    }
    return -1;
  }
}