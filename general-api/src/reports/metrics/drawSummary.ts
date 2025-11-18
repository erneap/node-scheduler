import { Alignment, Borders, Fill, Font, Workbook } from "exceljs";
import { Mission, Outage } from "scheduler-node-models/metrics";
import { GeneralTypes, SystemInfo } from "scheduler-node-models/metrics/systemdata";
import { User } from "scheduler-node-models/users";
import { Report } from 'scheduler-node-models/general';
import { MissionDay } from "./missionDay";
import { OutageDay } from "./outageDay";

export class DrawSummary extends Report {
  private reportType: GeneralTypes;
  private start: Date;
  private end: Date;
  private dailyReports: boolean;
  private missions: Mission[];
  private outages: Outage[];
  private systeminfo: SystemInfo;
  private fonts: Map<string, Partial<Font>>;
  private fills: Map<string, Fill>;
  private borders: Map<string, Partial<Borders>>;
  private alignments: Map<string, Partial<Alignment>>;

  constructor(type: GeneralTypes, start: Date, end: Date, missions: Mission[], 
    outages: Outage[], systemInfo: SystemInfo, daily?: boolean) {
    super();
    this.reportType = type;
    this.start = new Date(start);
    this.end = new Date(end);
    this.missions = [];
    if (missions && missions.length > 0) {
      missions.forEach(msn => {
        this.missions.push(new Mission(msn));
      })
    }
    this.outages = [];
    if (outages && outages.length > 0) {
      outages.forEach(outage => {
        this.outages.push(new Outage(outage));
      })
    }
    this.systeminfo = systemInfo;
    this.dailyReports = (daily) ? daily : false;
    this.fonts = new Map<string, Partial<Font>>();
    this.fills = new Map<string, Fill>();
    this.borders = new Map<string, Partial<Borders>>();
    this.alignments = new Map<string, Partial<Alignment>>();
  }

  create(user: User): Workbook {
    const workbook = new Workbook();
    workbook.creator = user.getFullName();
    workbook.created = new Date();
    const delta = Math.floor((this.end.getTime() - this.start.getTime()) / (24 * 3600000));
    if (delta == 1 && delta > 7 ) {
      this.dailyReports = false;
    }

    this.createStyles();
    this.createMissionSummary(workbook);

    return workbook;
  }

  createStyles() {
    // set fonts
    this.fonts.set("bold14", {bold: true, size: 14, color: { argb: 'ffffffff'}});
    this.fonts.set("bold12", {bold: true, size: 12, color: { argb: 'ff000000'}});
    this.fonts.set("nobold10", {bold: false, size: 10, color: { argb: 'ff000000'}});
    this.fonts.set("bold9", {bold: true, size: 9, color: { argb: 'ff000000'}});
    this.fonts.set("nobold9", {bold: false, size: 9, color: { argb: 'ff000000'}});
    this.fonts.set('notnorm', {bold: false, size: 9, color: { argb: 'ff0070c0'}});

    // set fills
    this.fills.set('black', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff000000'}});
    this.fills.set('white', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffffff'}});
    this.fills.set('odd', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffd3d3d3'}});
    this.fills.set('even', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffffff'}});

    // set borders
    this.borders.set('blackthin', {
      top: { style: 'thin', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ff000000'}},
      bottom: { style: 'thin', color: {argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ff000000'}}
    });
    this.borders.set('blackthinNoRight', {
      top: { style: 'thin', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ff000000'}},
      bottom: { style: 'thin', color: {argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ffffffff'}}
    });
    this.borders.set('blackthinNoLeft', {
      top: { style: 'thin', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ffffffff'}},
      bottom: { style: 'thin', color: {argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ff000000'}}
    });

    // set alignments
    this.alignments.set('center', {horizontal: 'center', vertical: 'middle', wrapText: true });
    this.alignments.set('leftctr', {horizontal: 'left', vertical: 'middle', wrapText: true });
    this.alignments.set('rightctr', {horizontal: 'right', vertical: 'middle', wrapText: true });
  }

  createMissionSummary(workbook: Workbook) {
    // set up the mission days from the missions provided
    const days: MissionDay[] = [];
    this.missions.forEach(msn => {
      let found = false;
      days.forEach((md, day) => {
        if (md.use(msn.missionDate)) {
          found = true;
          md.missions.push(new Mission(msn));
        }
      });
      if (!found) {
        const day = new MissionDay(new Date(msn.missionDate));
        day.missions.push(new Mission(msn));
      }
    });
    days.sort((a,b) => a.compareTo(b));

    const label = 'DRAW Missions';
    const sheet = workbook.addWorksheet(label);
    sheet.pageSetup.showGridLines = false;

    for (let i=0; i < 10; i++) {
      if (i !== 1) {
        sheet.getColumn(i).width = 8.43;
      } else {
        sheet.getColumn(i).width = 75.0
      }
    }

    // add header
    let nRow = 2;
    let style = {
      border: this.borders.get('blackthin'),
      fill: this.fills.get('black'),
      font: this.fonts.get('bold14'),
      alignment: this.alignments.get('center')
    };
    this.setCell(sheet, this.getCellID("B", nRow), this.getCellID("B", nRow), style,
      "DRAW Mission Summary");

    days.forEach(day => {
      nRow += 2;

      style = {
        border: this.borders.get('blackthin'),
        fill: this.fills.get('white'),
        font: this.fonts.get('nobold10'),
        alignment: this.alignments.get('leftctr')
      };
      this.setCell(sheet, this.getCellID("B", nRow), this.getCellID("B", nRow),
        style, this.getDateString(day.missionDate));
      if (day.missions.length === 0) {
        style = {
          border: this.borders.get('blackthin'),
          fill: this.fills.get('white'),
          font: this.fonts.get('nobold10'),
          alignment: this.alignments.get('center')
        };
        this.setCell(sheet, this.getCellID("B", nRow+1), this.getCellID("B", nRow+1),
          style, "No missions scheduled for this date");
      } else {
        day.missions.sort((a,b) => a.compareTo(b));
        day.missions.forEach((msn, m) => {
          let showMission = '';
          let u2Text = '';
          let sensorOutage = 0;
          let groundOutage = 0;
          let partialHB = -1;
          let partialLB = -1;
          let sensorComments = msn.comments;
          let executeMinutes = 0;
          if (this.systeminfo.platforms) {
            this.systeminfo.platforms.forEach(plat => {
              if (msn.platformID.toLowerCase() === plat.id.toLowerCase()) {
                msn.sensors.forEach(mSen => {
                  plat.sensors.forEach(sen => {
                    if (mSen.sensorID.toLowerCase() === sen.id.toLowerCase()
                      && sen.use(msn.exploitation, this.reportType)) {
                      sensorOutage = mSen.sensorOutage.totalOutageMinutes;
                      groundOutage = mSen.groundOutage;
                      sensorComments = sensorComments.trim();
                      if (sensorComments !== '') {
                        sensorComments += ', ';
                      }
                      sensorComments += mSen.comments;
                      executeMinutes = mSen.executedMinutes + mSen.additionalMinutes;
                      switch (sen.id.toLowerCase()) {
                        case "pme3":
                        case "pme4":
                          showMission = "- CWS/" + sen.id + ": Ket " + mSen.kitNumber
                            + ` was Code ${mSen.finalCode}`;
                          u2Text = ` with ${sen.association} and ${msn.communications}`;
                          break;
                        case "pme9":
                          showMission = `DDSA/PME9: Kit ${mSen.kitNumber}`
                            + ` was Code ${mSen.finalCode}`;
                          break;
                        case "pme12":
                          showMission = `- CICS/PME12: Kit ${mSen.kitNumber} was Code `
                            + `${mSen.finalCode}`;
                          partialHB = mSen.sensorOutage.partialHBOutageMinutes;
                          partialLB = mSen.sensorOutage.partialLBOutageMinutes;
                        case "imint":
                          showMission = "- CWS/IMINT Sensor";
                      }
                    }
                  });
                });
              }
            });
          }
          if (showMission !== '') {
            let text = `This mission on ${this.getDateString(msn.missionDate)} was `
              + `${msn.platformID} `;
            if (msn.tailNumber !== '') {
              text += ` using Article ${msn.tailNumber}`;
            }
            text += u2Text;
            if (msn.exploitation.toLowerCase() === 'primary') {
              text += `\n\r- Primary exploiting DGS was DGS-${msn.primaryDCGS}`
            }
            if (!msn.cancelled && !msn.indefDelay && !msn.aborted) {
              text += "\n\r" + showMission;
            } else if (msn.cancelled) {
              text += "\n\r- Mission Cancelled";
            } else if (msn.aborted) {
              text += "\n\r- Mission Aborted";
            } else if (msn.indefDelay) {
              text += "\n\r- Mission Indefinite Delay";
            }
            if (msn.exploitation.toLowerCase() === 'primary'
              && !msn.cancelled && !msn.aborted && !msn.indefDelay) {
              text += `\n\r- Ground Outages: ${groundOutage} mins.`
                + `\n\r- Sensor Outages: ${sensorOutage} mins.`;
              if (partialHB > 0) {
                text += `\n\r- Partial HB Outages: ${partialHB} mins.`;
              }
              if (partialLB > 0) {
                text += `\n\r- Partial LB Outages: ${partialLB} mins`;
              }
            }
            if (sensorComments !== '') {
              text += `\n\r- Comments: ${sensorComments}`;
            }
            text = text.trim();
            const textrows = text.split('\n\r');
            sheet.getRow(nRow+m+1).height = (textrows.length * 13.0);
            this.setCell(sheet, this.getCellID("B", nRow+m+1), 
              this.getCellID("B", nRow+m+1), style, text);
            this.setCell(sheet, this.getCellID("C", nRow+m+1), 
              this.getCellID("C", nRow+m+1), style, this.getTimeString(executeMinutes));
            this.setCell(sheet, this.getCellID("D", nRow+m+1), 
              this.getCellID("D", nRow+m+1), style, 
              this.getTimeString(executeMinutes-(sensorOutage+groundOutage)));
          }
        });
        nRow += day.missions.length;
      }
    });
  }

  createOutageSummary(workbook: Workbook) {
    const days: OutageDay[] = [];
    this.outages.forEach(outage => {
      let found = false;
      days.forEach(day => {
        if (day.use(outage.outageDate)) {
          found = true;
          day.outages.push(new Outage(outage));
        }
      });
      if (!found) {
        const day = new OutageDay(new Date(outage.outageDate));
        day.outages.push(new Outage(outage));
      }
    });
    days.sort((a,b) => a.compareTo(b));
    const label = 'DRAW Outage';
    const sheet = workbook.addWorksheet(label);
    sheet.pageSetup.showGridLines = false;

    const widths = [8.43, 11.0, 11.0, 12.0, 8.0, 110.0, 8.43, 8.43, 8.43, 8.43];
    widths.forEach((width, w) => {
      sheet.getColumn(w).width = width;
    });

    let nRow = 2;
    let style = {
      border: this.borders.get('blackthin'),
      fill: this.fills.get('black'),
      font: this.fonts.get('bold14'),
      alignment: this.alignments.get('center')
    };
    this.setCell(sheet, this.getCellID("B", nRow), this.getCellID("B", nRow), style,
      "DATE");
    this.setCell(sheet, this.getCellID("C", nRow), this.getCellID("C", nRow), style,
      "SYSTEM");
    this.setCell(sheet, this.getCellID("D", nRow), this.getCellID("D", nRow), style,
      "SUBSYSTEM");
    this.setCell(sheet, this.getCellID("E", nRow), this.getCellID("E", nRow), style,
      "Outage (Mins)");
    this.setCell(sheet, this.getCellID("F", nRow), this.getCellID("F", nRow), style,
      "PROBLEM(S)/RESOLUTION(S)");
    nRow++;

    days.forEach((day, d) => {
      style = {
        border: this.borders.get('blackthin'),
        fill: this.fills.get((nRow % 2 === 0) ? 'even' : 'odd'),
        font: this.fonts.get('nobold10'),
        alignment: this.alignments.get('center')
      };
      this.setCell(sheet, this.getCellID("B", nRow), this.getCellID("B", nRow), style, 
        this.getDateString(day.outageDate));
      if (day.outages.length === 0) {
        style.alignment = this.alignments.get('leftctr');
        this.setCell(sheet, this.getCellID("C", nRow), this.getCellID("F", nRow), style, 
          "NSTR")
      } else {
        day.outages.forEach((outage, out) => {
          style = {
            border: this.borders.get('blackthin'),
            fill: this.fills.get(((nRow+out) % 2 === 0) ? 'even' : 'odd'),
            font: this.fonts.get('nobold10'),
            alignment: this.alignments.get('center')
          };
          if (out > 0) {
            this.setCell(sheet, this.getCellID("B", nRow+out), 
              this.getCellID("B", nRow+out), style, '');
          }
          this.setCell(sheet, this.getCellID("C", nRow+out), this.getCellID("C", nRow+out), 
            style, outage.groundSystem.toUpperCase());
          this.setCell(sheet, this.getCellID("D", nRow+out), this.getCellID("D", nRow+out), 
            style, outage.groundSystem.toUpperCase());
          this.setCell(sheet, this.getCellID("E", nRow+out), this.getCellID("E", nRow+out), 
            style, outage.subSystem.toUpperCase());
          style.alignment = this.alignments.get('leftctr');
          this.setCell(sheet, this.getCellID("F", nRow+out), this.getCellID("F", nRow+out), 
            style, `PROBLEM(s): ${outage.problem}\rRESOLUTION(s): ${outage.fixAction}`);
          sheet.getRow(nRow+out).height = 26.0;
        });
        nRow += day.outages.length - 1;
      }
      nRow++;
    });
  }
}