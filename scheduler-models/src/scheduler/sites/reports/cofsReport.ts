import { Employee } from "../../employees";
import { Workcode } from "../../labor";
import { Company } from "../../teams/company";
import { ISection, Section } from "./section";

/**
 * This interface will define the data members associated with a CofS Report.
 */
export interface ICofSReport {
  id: number;
  name: string;
  shortname: string;
  unit: string;
  startdate: Date;
  enddate: Date;
  sections?: ISection[];
}

/**
 * This class implements the interface data members plus actions.
 */
export class CofSReport implements ICofSReport {
  public id: number;
  public name: string;
  public shortname: string;
  public unit: string;
  public startdate: Date;
  public enddate: Date;
  public sections: Section[];

  constructor(rpt?: ICofSReport) {
    this.id = (rpt) ? rpt.id : 0;
    this.name = (rpt) ? rpt.name : '';
    this.shortname = (rpt) ? rpt.shortname : '';
    this.unit = (rpt) ? rpt.unit : '';
    this.startdate = (rpt) ? new Date(rpt.startdate) : new Date(0);
    this.enddate = (rpt) ? new Date(rpt.enddate) : new Date(0);
    this.sections = [];
    if (rpt && rpt.sections && rpt.sections.length) {
      rpt.sections.forEach(sec => {
        this.sections.push(new Section(sec));
      });
      this.sections.sort((a,b) => a.compareTo(b));
    }
  }

  compareTo(other?: CofSReport): number {
    if (other) {
      if (this.startdate.getTime() === other.startdate.getTime()) {
        return (this.name < other.name) ? -1 : 1;
      }
      return (this.startdate.getTime() < other.startdate.getTime()) ? -1 : 1;
    }
    return -1;
  }

  use(start: Date, end: Date): boolean {
    return (this.startdate.getTime() <= end.getTime() 
      && this.enddate.getTime() >= start.getTime())
  }
  
  /**
   * This function will create an XML file from a CofS Report description.
   * @param start The date object used for the start of the report period.
   * @param end The date object used to signify the end of the period, but not included
   * in the report (1st day of next month).
   * @param workcodes The list of work codes used to signify shift or leave.
   * @param employees The list of possible employees used in this report.  Usually a list
   * of the site's employees.
   * @returns A File object for the XML data.
   */
  create(start: Date, end: Date, workcodes: Map<string, Workcode>, 
    employees: Employee[]): File {
    
    const options = { type: 'text/xml'};
    const now = new Date();
    const filename = `${this.shortname}-${now.getFullYear()}`
      + `${(now.getMonth()+1).toString().padStart(2, '0')}`
      + `${now.getDate().toString().padStart(2, '0')}.xml`;
    let content: string = '';
    const remarks: string[] = [];

    // Create the xml formated output and attach to content string.
    // 1. start with the standard header for xml plus entries for month and year, 
    //  and unit.
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
      'Nov', 'Dec' ];
    content += '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>\n'
      + '<fields xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
      + `\t<Month-Year>${months[start.getMonth()]}-${start.getFullYear()}`
      + '</Month-Year>\n'
      + `\t<Month-Year1>${months[start.getMonth()]}-${start.getFullYear()}`
      + '</Month-Year1>\n'
      + `\t<Unit>${this.unit}</Unit>\n`
      + `\t<Unit1>${this.unit}</Unit1>\n`;

    // next add in the report sections, which produce a table.
    this.sections.forEach((section, sid) => {
      const result = section.createReportSection(start, end,  workcodes, 
        employees, sid + 1, this.unit);
      if (result.output !== '') {
        const lines = result.output.split('\n');
        lines.forEach(line => {
          content += `\t${line}\n`;
        });
      }
      if (result.remarks.length > 0) {
        result.remarks.forEach(rmk => {
          remarks.push(rmk);
        });
      }
    });

    // lastly, add in the remarks section as a series of strings
    if (remarks.length > 0) {
      content += `\t<REMARKS>\n`;
      remarks.forEach(rmk => {
        content += `${rmk}\n`;
      })
      content += `\t</REMARKS>\n`;
    }

    // close the xml tag and finish.
    content += '</fields>\n';

    const xmlFile = new File([content], filename, options);
    return xmlFile;
  }
}