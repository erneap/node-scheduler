import { ITeam, Team } from "../teams";
import { ExcelRow, ExcelRowPeriod } from "./excelRow";
import { Workbook } from "exceljs";
import { Readable } from "stream";

export class SAPIngest {
  public files: Express.Multer.File[];
  public team: Team;

  constructor(files?: Express.Multer.File[], team?: ITeam) {
    this.files = (files) ? files : [];
    this.team = (team) ? new Team(team) : new Team();
  }

  async Process(): Promise<ExcelRowPeriod[]> {
    const result: ExcelRowPeriod[] = [];

    if (this.files.length > 0) {
      const allfiles = this.files.map(async(file, f) => {
        const results = await this.processFile(file);
        result.push(results);
      });
      await Promise.allSettled(allfiles);
    }
    return result;
  }

  async processFile(file: Express.Multer.File): Promise<ExcelRowPeriod> {
    const result: ExcelRowPeriod = new ExcelRowPeriod();
    // convert the file into a buffer to allow the exceljs library to create an excel
    // document to read through.
    const filereader = Readable.from(file.buffer);
    const fileDataU8: number[] = [];
    while (true) {
      const {done,value} = await filereader.read();
      if (done) break;

      fileDataU8.push(...value);
    }
    const fileBinary = Buffer.from(fileDataU8);

    const workbook = new Workbook();
    await workbook.xlsx.load(fileBinary.buffer);
    const worksheet = workbook.getWorksheet('Data');

    if (worksheet) {
      // get the columns from the from the first row
      const columns = new Map<string, number>();
      const nameRow = worksheet.getRow(1);
      nameRow.eachCell((cell, col) => {
        if (cell.value) {
          columns.set(cell.value.toString().toLowerCase(), col);
        }
      });

      const explanation = (columns.get('explanation')) ? columns.get('explanation') 
        : -1;
      const dataCols = ['date', 'personnel no.', 'charge number', 'prem. no.', 'ext.',
        'hours', 'charge number desc', 'explanation' ];
      if (explanation && explanation >= 0) {
        // get the data from the worksheet
        worksheet.eachRow((row, r) => {
          let value = row.getCell(explanation);
          if (r > 1 && value && !value.toString().toLowerCase().includes('total')) {
            // this row is pertainent data, so complete an excelrow object for the data 
            // in the row
            const eRow = new ExcelRow();
            // step through the columns to get the data for the row.
            dataCols.forEach(sCol => {
              const col = columns.get(sCol);
              if (col) {
                const sValue = row.getCell(col).toString().trim();
                switch (sCol) {
                  case 'date':
                    eRow.date = new Date(Date.parse(sValue));
                    break;
                  case 'personnel no.':
                    eRow.employee = sValue;
                    break;
                  case 'charge number':
                    eRow.chargeNumber = sValue;
                    break;
                  case 'prem. no.':
                    eRow.premium = sValue;
                    break;
                  case 'ext.':
                    eRow.extension = sValue;
                    break;
                  case 'hours':
                    const hPattern = "^[0-9]{1,2}(\.[0-9]+)?$";
                    const hourRE = new RegExp(hPattern);
                    if (hourRE.test(sValue)) {
                      eRow.hours = Number(sValue);
                    }
                    break;
                  case 'charge number desc':
                    eRow.description = sValue;
                    break;
                  case 'explanation':
                    eRow.comment = sValue;
                    break;
                }
              }
            });

            // check the row to see if it is of the leave type which is determined by 
            // the team workcode search value
            this.team.workcodes.forEach(wc => {
              if (wc.isLeave && wc.search) {
                if (eRow.description.toLowerCase().includes(wc.search.toLowerCase())) {
                  eRow.code = wc.id;
                  if (wc.id.toLowerCase() === 'h') {
                    const hPattern = '[hfHF][0-9]{1,2}';
                    const holRE = new RegExp(hPattern);
                    const matches = holRE.exec(eRow.comment);
                    if (matches && matches !== null) {
                      eRow.holidayID = matches[0];
                    }
                  }
                }
              }
            });
            if (eRow.date.getTime() < result.start.getTime()) {
              result.start = new Date(eRow.date);
            }
            if (eRow.date.getTime() > result.end.getTime()) {
              result.end = new Date(eRow.date);
            }
            result.rows.push(eRow)
          }
        });
      }
      result.rows.sort((a,b) => a.compareTo(b));
    }

    return result;
  }


}