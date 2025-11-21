import { RichText, Style, Worksheet } from "exceljs";

export class Formula {
  public formula: string = "";

  constructor(formula: string) {
    this.formula = formula;
  }
}

export class Report {  
  getCellID(col: string | number, row: number): string {
    if (typeof col === 'string') {
      return `${col}${row}`;
    }
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (col < letters.length) {
      return `${letters.substring(col, col+1)}${row}`;
    } else {
      const first = Math.floor(col/letters.length) - 1;
      const next = col % letters.length;
      return `${letters.substring(first, first+1)}${letters.substring(next, next+1)}${row}`;
    }
  }

  setCell(sheet: Worksheet, begin: string, end: string, style: Partial<Style>, 
    value: string | number | Formula | RichText[] | undefined, numFmt?: string) {
    if (begin !== end) {
      sheet.mergeCells(`${begin}:${end}`);
    }
    if (style.fill) {
      sheet.getCell(begin).fill = style.fill;
    }
    if (style.font) {
      sheet.getCell(begin).font = style.font;
    }
    if (style.alignment) {
      sheet.getCell(begin).alignment = style.alignment;
    }
    if (style.border) {
      sheet.getCell(begin).border = style.border;
    }
    if (style.numFmt) {
      sheet.getCell(begin).numFmt = style.numFmt;
    }
    if (numFmt && numFmt !== '') {
      sheet.getCell(begin).numFmt = numFmt;
    }
    
    if (!value && !(typeof value === 'number')) {
      sheet.getCell(begin).value = '';
    } else if (value instanceof Formula) {
      sheet.getCell(begin).value = { formula: value.formula };
    } else if (typeof value === 'string' || typeof value === 'number') {
      sheet.getCell(begin).value = value;
    } else {
      sheet.getCell(begin).value = { 'richText': value };
    }
  }
  
  getDateString(date: Date): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 
      'Oct', 'Nov', 'Dec'];

    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  getTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes - (hours * 60);

    return ((hours < 10) ? `0${hours}:` : `${hours}:`) 
      + ((mins < 10) ? `0${mins}` : `${mins}`);
  }

  getNumberString(value: number, decimal: number): string {
    return value.toFixed(decimal)
  }
}

export interface ReportRequest {
  reportType: string;
  period?: string;
  subreport?: string;
  teamid?: string;
  siteid?: string;
  companyid?: string;
  password?: string;
  startDate?: string;
  endDate?: string;
  userid?: string;
  includeDaily: boolean;
}