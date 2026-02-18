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
  description: string;
  comment: string;
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
  public description: string;
  public comment: string;

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
    this.description = (row) ? row.description : '';
    this.comment = (row) ? row.comment : '';
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

  toString(): string {
    let result = `${this.date.toDateString()} - ${this.employee} - `;
    if (this.code !== '') {
      result += `${this.code} `
      if (this.code.toLowerCase() === 'h') {
        result += `(${this.holidayID})`
      }
    } else {
      result += `${this.chargeNumber}/${this.extension}`
    }
    result += ` - ${this.hours.toFixed(2)}`;
    return result;
  }
}

/**
 * This interface will contain the rows of information for employees reported on a single
 * SAP Ingest spreadsheet or a Manual Excel spreadsheet, plus the start and ending dates
 * for the spreadsheet, which equates to the first date reported on the sheet and the last.
 */
export interface IExcelRowPeriod {
  start: Date;
  end: Date;
  rows: IExcelRow[];
}

/**
 * This class implements the IExcelRowPeriod interface and provides either default 
 * values for the build or fills the information into the object.
 */
export class ExcelRowPeriod implements IExcelRowPeriod {
  public start: Date;
  public end: Date;
  public rows: ExcelRow[];

  constructor(period?: IExcelRowPeriod) {
    this.start = (period) ? new Date(period.start) : new Date(Date.UTC(9999, 11, 30));
    this.end = (period) ? new Date(period.end) : new Date(0);
    this.rows = [];
    if (period && period.rows.length > 0) {
      period.rows.forEach(row => {
        this.rows.push(new ExcelRow(row));
      });
      this.rows.sort((a,b) => a.compareTo(b));
    }
  }
}