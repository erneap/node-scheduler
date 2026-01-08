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

  constructor(date: Date, files?: File[], team?: ITeam, site?: ISite, company?: string) {
    this.files = (files) ? files : [];
    this.team = (team) ? new Team(team) : new Team();
    this.site = (site) ? new Site(site) : new Site();
    this.company = (company) ? company : '';
    this.docDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
  }

  async Process(): Promise<ExcelRow[]> {
    const result: ExcelRow[] = [];

    if (this.files.length > 0) {
      const allfiles = this.files.map(async(file, f) => {
        const results = await this.processFile(file);
        console.log(results.length);
        result.push(...results);
      });
      await Promise.allSettled(allfiles);
    }

    result.sort((a,b) => a.compareTo(b));
    return result;
  }

  async processFile(file: File): Promise<ExcelRow[]> {
    const result: ExcelRow[] = [];

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

    if (worksheet) {
      worksheet.eachRow(async (row, r) => {
        const name = row.getCell(1).toString().trim();
        if (name !== '' && name !== 'Name' && name.toLowerCase() !== 'remarks'
          && name.toLowerCase() !== 'N/A') {
          console.log(name);
          if (this.site.employees) {
            const emp = this.site.employees.find(e =>
              e.name.getLastFirst().toLowerCase() === name.toLowerCase());
            if (emp) {
              for (let c = 3; c < 34; c++) {
                const results = await this.readExcelRow(row, c, emp);
                console.log(results.length);
                result.push(...results);
              }
            }
          } else {
            throw new Error('No employees in site');
          }
        }

      });
    } else {
      throw new Error('No worksheet');
    }
    result.sort((a,b) => a.compareTo(b));
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

  async readExcelRow(row: Row, c: number, emp: Employee): Promise<ExcelRow[]> {
    const result: ExcelRow[] = [];
    // create test patterns for hours, if value doesn't match the hours pattern, it will
    // be assumed to be a leave code
    const hPattern = "^[0-9]{1,2}(\.[0-9]+)?$";
    const hourRE = new RegExp(hPattern);
    const colDate = new Date(this.docDate.getTime() + (24 * 3600000 * (c-3)));
    console.log(colDate);
    // Step through the days of the month to create the excel rows to add
    // for this employee
    const sValue = row.getCell(c).toString().trim();
    console.log(sValue);
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
          result.push(eRow);
        }
      } else {
        // this will be a leave code, so find out which to use, then 
        // create the excel row with the employee's standard workday.
        this.team.workcodes.forEach(wc => {
          if (wc.isLeave && wc.altcode 
            && sValue.toLowerCase() === wc.altcode) {
            const eRow = new ExcelRow();
            eRow.date = new Date(colDate);
            eRow.employee = emp.companyinfo.employeeid;
            eRow.code = wc.id;
            eRow.hours = emp.getStandardWorkday(colDate);
            result.push(eRow);
          }
        });
      }
    }
    return result;
  }
}