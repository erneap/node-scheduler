import { Employee, EmployeeLaborCode } from "../../employees";
import { ILaborCode, LaborCode, Workcode } from "../../labor";
import { Company } from "../../teams/company";

/**
 * This interface will define the data members for a report section of a CofS report
 * definition.
 */
export interface ISection {
  id: number;
  company: string;
  label: string;
  signature: string;
  laborcodes?: ILaborCode[];
  showunit: boolean;
}

/**
 * This class implements the data members and actions for CofS report sections.
 */
export class Section implements ISection {
  public id: number;
  public company: string;
  public label: string;
  public signature: string;
  public laborcodes: LaborCode[];
  public showunit: boolean;

  constructor(sec?: ISection) {
    this.id = (sec) ? sec.id : 0;
    this.company = (sec) ? sec.company : '';
    this.label = (sec) ? sec.label : '';
    this.signature = (sec) ? sec.signature : '';
    this.showunit = (sec) ? sec.showunit : false;
    this.laborcodes = [];
    if (sec && sec.laborcodes && sec.laborcodes.length) {
      sec.laborcodes.forEach(lc => {
        this.laborcodes.push(new LaborCode(lc));
      });
      this.laborcodes.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: Section): number {
    if (other) {
      return (this.id < other.id) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function will produce a Certificate of Service report section, which usually
   * holds the employees and their work hours in respect to the period provided as an 
   * XML output string.
   * @param start The date object used for the start of the report period.
   * @param end The date object to mark the end of the period, but not included in the 
   * period.
   * @param workcodes A mapped list of workcodes to be used in this report.
   * @param employees A list of employees that may or may not have worked on labor codes
   * associated with this section.
   * @param sectionID The numeric value (integer) for the position this section holds 
   * within the overall report file.
   * @param unit The string value for the unit the report is associated with.
   * @returns An interface consisting of the xml output for section's data, plus
   * an array of strings for remarks created during the section creation.
   */
  createReportSection(start: Date, end: Date, workcodes: Map<string, Workcode>, 
    employees: Employee[], sectionID: number, unit: string): 
    {output: string, remarks: string[]} {
    const remarks: string[] = [];
    let output = '';
    output += `<Company${sectionID}>${this.label}</Company${sectionID}>\n`
      + `<Section${sectionID}_Lead>${this.signature}</Section${sectionID}_Lead>\n`;
    if (this.showunit) {
      output += `<Unit${sectionID}>${unit}</Unit${sectionID}>\n`;
    }
    let count = 0;
    employees.forEach(emp => {
      if (emp.isActive(start) || emp.isActive(end)) {
        let hours = 0.0;
        let bPrimary = false;
        this.laborcodes.forEach(lc => {
          hours += emp.getWorkedHours(start, end, lc.chargeNumber, lc.extension);
          if (emp.isPrimaryCode(start, new EmployeeLaborCode({ 
            chargenumber: lc.chargeNumber, extension: lc.extension }))) {
            bPrimary = true;
          }
        });

        if (hours > 0.0 || bPrimary) {
          count++;
          const result = this.createEmployeeSectionData(count, sectionID, emp, start, end, 
            workcodes);
          if (result.output !== '') {
            const lines = result.output.split('\n');
            lines.forEach(line => {
              output += `\t${line}\n`;
            });
          }
          if (result.remarks.length > 0) {
            result.remarks.forEach(rmk => {
              remarks.push(rmk);
            })
          }
        }
      }
    });
    return {output: output, remarks: remarks};
  }

  /**
   * This function will create a CofS Section's employee row data based on the information
   * provided
   * @param count The numeric value for the position the employee is in the section list
   * @param coCount The section identifier, numeric value Section count.
   * @param emp The employee object for the row of data
   * @param start The date object representing the start of the report period.
   * @param end The date object for the end of the report period (not included in report)
   * @param workcodes A mapped list of the workcodes to be used within the report.
   * @returns An interface consisting of the xml output for the employee row data, plus
   * an array of strings for remarks created during the row creation.
   */
  createEmployeeSectionData(count: number, coCount: number, emp: Employee, 
    start: Date, end: Date, workcodes:Map<string, Workcode>): 
    {output: string, remarks: string[]} {
    const empLaborCodes: EmployeeLaborCode[] = [];
    this.laborcodes.forEach(lc => {
      empLaborCodes.push(new EmployeeLaborCode(
        { chargenumber: lc.chargeNumber,
          extension: lc.extension
        }
      ));
    });
    const remarks: string[] = [];
    let output = '';
    let total = 0.0;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
      'Nov', 'Dec' ];
    // every employee row starts with name and job title.
    let label = `NameRow${count}`;
    if (coCount > 1) {
      label += `_${coCount}`;
    }
    output += `<${label}>${emp.name.getLastFirst()}</${label}>\n`;
    label = `PositionRow${count}`;
    if (coCount > 1) {
      label += `_${coCount}`;
    }
    output += `<${label}>${emp.companyinfo.jobtitle}</${label}>\n`;

    // next add the daily information
    let current = new Date(Date.UTC(start.getFullYear(), start.getMonth(), 1));
    while (current.getTime() < end.getTime()) {
      let hours = 0.0;
      label = `Section${coCount}Row${count}_${current.getDate().toString().padStart(2, '0')}`;
      this.laborcodes.forEach(lc => {
        const thours =  emp.getWorkedHours(current, current,
          lc.chargeNumber, lc.extension);
        if (thours > 0) {
          
          hours += thours;
        }

      });
      if (hours > 0.0) {
        total += hours;
        const iHours = Math.floor(hours * 10);
        const icHours = Math.floor(hours) * 10;
        if (icHours === iHours) {
          output += `<${label}>${hours.toFixed(0)}</${label}>\n`;
        } else {
          output += `<${label}>${hours.toFixed(1)}</${label}>\n`;
        }
        if (hours > 12.0) {
          const remark = `${this.company.toUpperCase()}: ${emp.name.getFirstLast()} `
            + `received a safety briefing for working over 12 hours on `
            + `${current.getDate().toString().padStart(2, '0')} ${months[current.getMonth()]}`;
          remarks.push(remark);
        }
      } else {
        const wd = emp.getWorkday(current, 'actuals', empLaborCodes);
        if (wd && wd.code !== '') {
          let wc = workcodes.get(wd.code);
          if (wc && wc.altcode && wc.altcode !== '') {
            output += `<${label}>${wc.altcode}</${label}>\n`;
          } else {
            output += `<${label}/>\n`;
          }
        } else {
          output += `<${label}/>\n`;
        }
      } 
      current = new Date(current.getTime() + (24 * 3600000));
    }

    // add total hours information
    label = `TotalHoursRow${count}`;
    if (coCount > 1) {
      label += `_${coCount}`;
    }
    output += `<${label}>${total.toFixed(1)}</${label}>\n`;
    if (total > 200.0) {
      const remark = `${this.company.toUpperCase()}: ${emp.name.getFirstLast()} exceeded `
        + '200 hours to support ops tempo.';
      remarks.push(remark);
    }
    
    return {output: output, remarks: remarks};
  }
  
}