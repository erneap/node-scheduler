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
 * This interface will contain all the rows of information for an employee for 
 * the period of time.
 */
export interface IExcelRowEmployee {
  employeeID: string;
  rows: IExcelRow[];
}

/**
 * This class implements the IExcelRowEmployee for employees reported on a single
 * SAP Ingest spreadsheet or a Manual Excel spreadsheet,
 */
export class ExcelRowEmployee implements IExcelRowEmployee {
  public employeeID: string;
  public rows: ExcelRow[];

  constructor(emp?: IExcelRowEmployee) {
    this.employeeID = (emp) ? emp.employeeID : '';
    this.rows = [];
    if (emp) {
      emp.rows.forEach(row => {
        this.rows.push(new ExcelRow(row));
      });
      this.rows.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: ExcelRowEmployee): number {
    if (other) {
      return (this.employeeID < other.employeeID) ? -1 : 1;
    }
    return -1;
  }

  addRow(row: ExcelRow) {
    this.rows.push(new ExcelRow(row));
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
  employees: IExcelRowEmployee[];
}

/**
 * This class implements the IExcelRowPeriod interface and provides either default 
 * values for the build or fills the information into the object.
 */
export class ExcelRowPeriod implements IExcelRowPeriod {
  public start: Date;
  public end: Date;
  public employees: ExcelRowEmployee[];

  constructor(period?: IExcelRowPeriod) {
    this.start = (period) ? new Date(period.start) : new Date(Date.UTC(9999, 11, 30));
    this.end = (period) ? new Date(period.end) : new Date(0);
    this.employees = [];
    if (period) {
      period.employees.forEach(emp => {
        this.employees.push(new ExcelRowEmployee(emp));
      });
    }
  }

  addRow(row: ExcelRow) {
    if (row.date.getTime() < this.start.getTime()) {
      this.start = new Date(row.date);
    }
    if (row.date.getTime() > this.end.getTime()) {
      this.end = new Date(row.date);
    }
    let found = false;
    this.employees.forEach((emp, e) => {
      if (emp.employeeID === row.employee) {
        found = true;
        emp.addRow(row);
        emp.rows.sort((a,b) => a.compareTo(b));
        this.employees[e] = emp;
      }
    });
    if (!found) {
      const newEmp = new ExcelRowEmployee();
      newEmp.employeeID = row.employee;
      newEmp.addRow(row);
      this.employees.push(newEmp);
      this.employees.sort((a,b) => a.compareTo(b));
    }
  }
}