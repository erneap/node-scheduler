import { Row, Workbook } from "exceljs";
import { ISite, Site } from "../sites";
import { ITeam, Team } from "../teams";
import { ExcelRow } from "./excelRow";
import { LaborCode } from "../labor";
import { Employee } from "../employees";

export class ExcelRowIngest {
  public files: File[];
  public team: Team;
  public site: Site;
  public company: string;
  public docDate: Date;
  public results: ExcelRow[];

  constructor(date: Date, files?: File[], team?: ITeam, site?: ISite, company?: string) {
    this.files = (files) ? files : [];
    this.team = (team) ? new Team(team) : new Team();
    this.site = (site) ? new Site(site) : new Site();
    this.company = (company) ? company : '';
    this.docDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
    this.results = [];
  }

  async Process(): Promise<ExcelRow[]> {
    this.results = [];

    if (this.files.length > 0) {
      const allfiles = this.files.map(async(file, f) => {
        await this.processFile(file);
      });
      await Promise.allSettled(allfiles);
    }

    this.results.sort((a,b) => a.compareTo(b));
    return this.results;
  }

  async processFile(file: File): Promise<void> {
    // convert the file into a buffer to allow the exceljs library to create an excel
    // document to read through.
    const filereader = file.stream().getReader();
    const fileDataU8: number[] = [];
    while (true) {
      const {done,value} = await filereader.read();
      if (done) break;

      fileDataU8.push(...value);
    }
    const fileBinary = Buffer.from(fileDataU8);

    const workbook = new Workbook();
    await workbook.xlsx.load(fileBinary.buffer);
    const worksheet = workbook.getWorksheet('Sheet1');

    const monthDates: Date[] = [];
    for (let d = 0; d < 31; d++) {
      monthDates.push(new Date(this.docDate.getTime() + (d * 24 * 3600000)));
    }

    if (worksheet) {
      worksheet.eachRow(async (row, r) => {
        if (row.getCell(1) && row.getCell(1) !== null && row.getCell(1).value !== null) {
          const name = row.getCell(1).toString().trim();
          if (name.includes(',')) {
            if (this.site.employees) {
              const emp = this.site.employees.find(e =>
                e.name.getLastFirst().toLowerCase() === name.toLowerCase());
              if (emp) {
                const rowPromises = monthDates.map(async(day,d) => {
                  await this.readCell(row, d+3, day, emp);
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

  async readCell(row: Row, c: number, colDate: Date, emp: Employee): Promise<void> {
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
          this.results.push(new ExcelRow(eRow));
        }
      } else {
        // this will be a leave code, so find out which to use, then 
        // create the excel row with the employee's standard workday.
        this.team.workcodes.forEach(wc => {
          if (wc.isLeave && wc.altcode 
            && sValue.toLowerCase() === wc.altcode.toLowerCase()) {
            const eRow = new ExcelRow();
            eRow.date = new Date(colDate);
            eRow.employee = emp.companyinfo.employeeid;
            eRow.code = wc.id;
            eRow.hours = emp.getStandardWorkday(colDate);
            this.results.push(new ExcelRow(eRow));
          }
        });
      }
    }
  }
}