import { ExcelRow } from "./excelRow";
import { Workbook } from "exceljs";

export class SAPIngest {
  public files: File[];
  public team: string;

  constructor(files?: File[], team?: string) {
    this.files = (files) ? files : [];
    this.team = (team) ? team : '';
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
      if (explanation && explanation >= 0) {
        // get the data from the worksheet
        worksheet.eachRow((row, r) => {
          let value = row.getCell(explanation);
          if (value && !value.toString().toLowerCase().includes('total')) {
            // this row is pertainent data, so complete an excelrow object for the data 
            // in the row
            const eRow = new ExcelRow();
            // start with the row's date
            let col = columns.get('date');
            if (col) {
              eRow.date =  new Date(Date.parse(row.getCell(col).toString()))
            }
          }
        });
      }
    }

    return result;
  }


}