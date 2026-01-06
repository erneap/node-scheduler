/**
 * This interface defines the minimum data to be pulled from a normal RTIME ingest row, 
 * minus the employee information the row pertains to.  These will be grouped with 
 * a constraining object to provide the employee info.
 */
export interface IExcelRow {
  date: Date;
  employee: string;
  premium : string;
  chargeNumber: string;
  extension: string;
  code: string;
  modified: boolean;
  hours: number;
  holidayID: string;
}

export class ExcelRow implements IExcelRow {
  public date: Date;
  public employee: string;
  public premium: string;
  public chargeNumber: string;
  public extension: string;
  public code: string;
  public modified: boolean;
  public hours: number;
  public holidayID: string;

  constructor(row?: IExcelRow) {
    this.date = (row) ? new Date(row.date) : new Date();
    this.employee = (row) ? row.employee : '';
    this.premium = (row) ? row.premium : '1';
    this.chargeNumber = (row) ? row.chargeNumber : '';
    this.extension = (row) ? row.extension : '';
    this.code = (row) ? row.code : '';
    this.modified = (row) ? row.modified : false;
    this.hours = (row) ? row.hours : 0.0;
    this.holidayID = (row) ? row.holidayID : '';
  }

  compareTo(other?: ExcelRow): number {
    if (other) {
      if (this.employee.toLowerCase() === other.employee.toLowerCase()) {
        if (this.date.getTime() === other.date.getTime()) {
          if (this.chargeNumber.toLowerCase() === other.chargeNumber.toLowerCase()) {
            return (this.extension.toLowerCase() < other.extension.toLowerCase()) 
              ? -1 : 1;
          }
          return (this.chargeNumber.toLowerCase() < other.chargeNumber.toLowerCase()) 
            ? -1 : 1;
        }
        return (this.date.getTime() < other.date.getTime()) ? -1 : 1;
      }
      return (this.employee.toLowerCase() < other.employee.toLowerCase()) ? -1 : 1;
    }
    return -1;
  }
}