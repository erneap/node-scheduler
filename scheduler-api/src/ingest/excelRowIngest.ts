import { Row, Workbook } from "exceljs";
import { ISite, Site } from "scheduler-models/scheduler/sites";
import { ITeam, Team } from "scheduler-models/scheduler/teams";
import { ExcelRow, ExcelRowPeriod } from "scheduler-models/scheduler/ingest/excelRow";
import { LaborCode } from "scheduler-models/scheduler/labor";
import { Employee } from "scheduler-models/scheduler/employees";
import {Readable } from 'stream';

export class ExcelRowIngest {
  public files: Express.Multer.File[];
  public team: Team;
  public site: Site;
  public company: string;
  public docDate: Date;

  constructor(date: Date, files?: Express.Multer.File[], team?: ITeam, site?: ISite, 
    company?: string) {
    this.files = (files) ? files : [];
    this.team = (team) ? new Team(team) : new Team();
    this.site = (site) ? new Site(site) : new Site();
    this.company = (company) ? company : '';
    this.docDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
    console.log(this.docDate)
  }

  async Process(): Promise<ExcelRowPeriod[]> {
    const results: ExcelRowPeriod[] = [];

    if (this.files.length > 0) {
      const allfiles = this.files.map(async(file, f) => {
        const result = await this.processFile(file);
        results.push(result);
      });
      await Promise.allSettled(allfiles);
    }

    return results;
  }

  async processFile(file: Express.Multer.File): Promise<ExcelRowPeriod> {
    const result: ExcelRowPeriod = new ExcelRowPeriod();

    const workbook = new Workbook();
    const temp = (process.env.TEMP_STORAGE) ? process.env.TEMP_STORAGE 
      : '/Users/antonerne/temp';
    const filename = `${temp}/${file.originalname}`;
    await workbook.xlsx.readFile(filename);
    const worksheet = workbook.getWorksheet('Sheet1');
    let start = new Date(this.docDate);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));

    const monthDates: Date[] = [];
    while (start.getTime() < end.getTime()) {
      monthDates.push(new Date(start));
      start = new Date(start.getTime() + (24 * 3600000));
    }

    if (worksheet) {
      worksheet.eachRow(async (row, r) => {
        if (row.getCell(1) && row.getCell(1) !== null && row.getCell(1).value !== null) {
          const name = row.getCell(1).toString().trim();
          if (name.includes(',')) {
            const nameparts = name.split(',');
            const last = nameparts[0].trim();
            const first = nameparts[1].trim();
            if (this.site.employees) {
              const emp = this.site.employees.find(e =>
                e.name.lastname.toLowerCase() === last.toLowerCase()
                && e.name.firstname.toLowerCase() === first.toLowerCase());
              if (emp) {
                const rowPromises = monthDates.map(async(day,d) => {
                  const erow = await this.readCell(row, d+3, day, emp);
                  if (erow !== null) {
                    result.addRow(erow);
                  }
                });
                await Promise.allSettled(rowPromises);
              }
            } else {
              throw new Error('No employees in site');
            }
          }
        }
      });
    } else {
      throw new Error('No worksheet');
    }
    return result;
  }

  /**
   * This function is used to provide a list of labor codes for a particular date and
   * for site and company
   * @param date A date object used in comparison to get forecast, which contains a list 
   * of laborcodes the employee can be assigned against.
   * @returns A list of labor codes that can be assigned to an employee.
   */
  async getForecast(date: Date): Promise<LaborCode[]> {
    const laborcodes: LaborCode[] = [];
    this.site.forecasts.forEach(fcst => {
      if (fcst.use(date, this.company)) {
        fcst.laborCodes.forEach(lc => {
          laborcodes.push(new LaborCode(lc))
        });
      }
    });
    return laborcodes;
  }

  async readCell(row: Row, c: number, colDate: Date, emp: Employee): Promise<ExcelRow | null> {
    // create test patterns for hours, if value doesn't match the hours pattern, it will
    // be assumed to be a leave code
    const hPattern = "^[0-9]{1,2}(\.[0-9]+)?$";
    const hourRE = new RegExp(hPattern);
    // Step through the days of the month to create the excel rows to add
    // for this employee
    const sValue = row.getCell(c).toString().trim();
    if (sValue !== '') {
      if (hourRE.test(sValue)) {
        // test for value being an hours, if true find out which labor code
        // to use, then create the excel row and add to the database.
        let laborcode = new LaborCode();
        const laborcodes = await this.getForecast(colDate);
        emp.assignments.forEach(asgmt => {
          if (asgmt.useAssignment(colDate)) {
            asgmt.laborcodes.forEach(alc => {
              laborcodes.forEach(flc => {
                if (flc.chargeNumber === alc.chargenumber
                  && flc.extension === alc.extension) {
                  laborcode.chargeNumber = flc.chargeNumber;
                  laborcode.extension = flc.extension;
                }                             
              });
            });
          }
        });
        if (laborcode.chargeNumber !== '') {
          const eRow = new ExcelRow();
          eRow.date = new Date(colDate);
          eRow.employee = emp.companyinfo.employeeid;
          eRow.chargeNumber = laborcode.chargeNumber;
          eRow.extension = laborcode.extension;
          eRow.premium = '1';
          eRow.hours = Number(sValue);
          return new ExcelRow(eRow);
        }
      } else {
        console.log(`${emp.name.lastname} - ${sValue}`);
        // this will be a leave code, so find out which to use, then 
        // create the excel row with the employee's standard workday.
        let found = false;
        const eRow = new ExcelRow();
        this.team.workcodes.forEach(wc => {
          if (!found && wc.isLeave && wc.altcode 
            && sValue.toLowerCase() === wc.altcode.toLowerCase()) {
            found = true;
            eRow.date = new Date(colDate);
            eRow.employee = emp.companyinfo.employeeid;
            eRow.code = wc.id;
            eRow.hours = emp.getStandardWorkday(colDate);
          }
        });
        if (found) {
          return new ExcelRow(eRow);
        }
      }
    }
    return null
  }
}