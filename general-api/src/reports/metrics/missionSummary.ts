import { Alignment, Border, Borders, Fill, Font, Style, Workbook, Worksheet } from "exceljs";
import { GeneralTypes, SystemInfo } from "scheduler-node-models/metrics/systemdata";
import { User } from "scheduler-node-models/users";
import { Mission } from "scheduler-node-models/metrics";
import { Outage } from "scheduler-node-models/metrics";
import { MissionType } from "./missionType";
import { Report } from "scheduler-node-models/general";

export class MissionSummary extends Report {
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
    super()
    this.reportType = type;
    this.start = new Date(start);
    this.end = new Date(end);
    this.missions = missions;
    this.outages = outages;
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
    this.createSummarySheet(workbook, this.start, this.end, this.dailyReports, 
      this.reportType, '');

    return workbook;
  }

  createStyles() {
    // set fonts
    this.fonts.set("bold14", {bold: true, size: 14, color: { argb: 'ff000000'}});
    this.fonts.set("bold12", {bold: true, size: 12, color: { argb: 'ff000000'}});
    this.fonts.set("nobold10", {bold: false, size: 10, color: { argb: 'ff000000'}});
    this.fonts.set("bold9", {bold: true, size: 9, color: { argb: 'ff000000'}});
    this.fonts.set("nobold9", {bold: false, size: 9, color: { argb: 'ff000000'}});
    this.fonts.set('notnorm', {bold: false, size: 9, color: { argb: 'ff0070c0'}});

    // set fills
    this.fills.set('lblhead', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffcccccc'}});
    this.fills.set('plathead', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffb8cce4'}});
    this.fills.set('platlabel', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffe5b8b7'}});
    this.fills.set('platsen', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffffff'}});

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

  createSummarySheet(workbook: Workbook, start: Date, end: Date, bDaily: boolean, 
    rptType: GeneralTypes, label?: string): void {
    const exploitations = ['Primary', 'Shadow/Federated'];
    
    // pull the missions for the period and map them by platform and exploitation
    const missionMap = new Map<string, MissionType>();
    this.missions.forEach(msn => {
      if (msn.useMission(start, end)) {
        let exp = msn.exploitation;
        if (exp.toLowerCase() !== 'primary') {
          exp = 'Shadow/Federated';
        }
        const key = exp.toUpperCase() + "|" + msn.platformID;
        let mtype = missionMap.get(key);
        if (!mtype) {
          mtype = new MissionType(exp, msn.platformID);
          missionMap.set(key, mtype);
        }
        mtype.missions.push(new Mission(msn));
      }
    });

    // compile composite sensor list
    const sensors: string[] = [];
    for (const [key, mtype] of missionMap) {
      const sens = mtype.getSensorList();
      sens.forEach(sen => {
        let found = false;
        sensors.forEach(s => {
          if (s.toLowerCase() === sen.toLowerCase()) {
            found = true;
          }
        });
        if (!found) {
          sensors.push(sen);
        }
      });
    }

    // pull ground outages for period
    const outages: Outage[] = [];
    this.outages.forEach(outage => {
      if (outage.useOutage(start, end)) {
        outages.push(new Outage(outage));
      }
    });

    if (!label) {
      label = "Summary";
      if (Math.floor((end.getTime() - start.getTime()) / (24 * 3600000)) === 1) {
        label = this.getDateString(start);
      }
    }
    const sheet = workbook.addWorksheet(label);
    sheet.pageSetup.showGridLines = false;

    const widths = [ 8, 7, 4, 7, 8, 8, 8, 8, 8, 8, 8, 8];
    widths.forEach((width, w) => {
      sheet.getColumn(w).width = width;
    });

    // create headers/labels at top of page
    sheet.getRow(3).height = 18;
    let style = {
      border: this.borders.get('blackthin'),
      fill: this.fills.get('lblhead'),
      font: this.fonts.get('bold12'),
      alignment: this.alignments.get('center')
    };
    this.setCell(sheet, 'B3', 'D3', style, 'Summary Period');
    this.setCell(sheet, 'E3', 'F3', style, 'From:');
    this.setCell(sheet, 'G3','H3', style, 'To:');
    this.setCell(sheet, 'I3','J3', style, 'Execution Time');
    this.setCell(sheet, 'B4','D4', style, '');
    this.setCell(sheet, 'E4','F4', style, this.getDateString(start));
    this.setCell(sheet, 'G4','H4', style, this.getDateString(end));

    // calculate total execution time
    let execution = 0
    for (const [key, mtype] of missionMap) {
      execution += (mtype.getExecutedTime(sensors, '') 
        + mtype.getAdditionalTime(sensors, '')) - mtype.getOverlap();
    }
    this.setCell(sheet, 'I4','J4', style, this.getTimeString(execution));

    // summary of exploitation/platforms and sensors
    style = {
      border: this.borders.get('blackthin'),
      fill: this.fills.get('plathead'),
      font: this.fonts.get('bold9'),
      alignment: this.alignments.get('leftctr')
    };
    this.setCell(sheet, 'B6','F7', style, 'SYSTEM');
    this.setCell(sheet, 'G6','J6', style, 'SORTIES');
    this.setCell(sheet, 'G7','G7', style, 'SCHED');
    this.setCell(sheet, 'H7','H7', style, 'EXEC');
    this.setCell(sheet, 'I7','I7', style, 'CANCEL');
    this.setCell(sheet, 'J7','J7', style, 'ABORT');

    let nRow = 7;
    exploitations.forEach(exp => {
      const sensorList: string[] = [];
      this.systeminfo.platforms?.forEach(plat => {
        plat.sensors.forEach(pSen => {
          let bUse = false;
          pSen.exploitations?.forEach(e => {
            if (e.exploitation.toLowerCase() === exp.toLowerCase() 
              && (rptType === GeneralTypes.ALL 
              || (rptType === GeneralTypes.GEOINT && e.showOnGEOINT)
              || (rptType === GeneralTypes.MIST && e.showOnMIST)
              || (rptType === GeneralTypes.SYERS && e.showOnGSEG)
              || (rptType === GeneralTypes.XINT && e.showOnXINT))) {
              bUse = true;
            }
          });
          if (bUse) {
            let found = false;
            sensorList.forEach(s => {
              if (s.toLowerCase() === pSen.id.toLowerCase()) {
                found = true;
              }
            });
            if (!found) {
              sensorList.push(pSen.id);
            }
          }
        });
      });
      nRow++;
      const lStyle = {
        border: this.borders.get('blackthin'),
        fill: this.fills.get('platlabel'),
        font: this.fonts.get('nobold9'),
        alignment: this.alignments.get('leftctr')
      };
      const cStyle = {
        border: this.borders.get('blackthin'),
        fill: this.fills.get('platlabel'),
        font: this.fonts.get('nobold9'),
        alignment: this.alignments.get('center')
      };
      const prStyle = {
        border: this.borders.get('blackthin'),
        fill: this.fills.get('platsen'),
        font: this.fonts.get('nobold9'),
        alignment: this.alignments.get('rightctr')
      };
      const prdStyle = {
        border: this.borders.get('blackthin'),
        fill: this.fills.get('platsen'),
        font: this.fonts.get('nobold9'),
        alignment: this.alignments.get('center'),
      };
      this.setCell(sheet, this.getCellID('B', nRow), this.getCellID('F', nRow), lStyle,
        exp);
      this.setCell(sheet, this.getCellID('G', nRow), this.getCellID('G', nRow), cStyle, 
        this.getNumberString(this.getTotal('scheduled', exp, missionMap, sensorList), 0));
      this.setCell(sheet, this.getCellID('H', nRow), this.getCellID('G', nRow), cStyle, 
        this.getNumberString(this.getTotal('executed', exp, missionMap, sensorList), 0));
      this.setCell(sheet, this.getCellID('I', nRow), this.getCellID('G', nRow), cStyle, 
        this.getNumberString(this.getTotal('cancelled', exp, missionMap, sensorList), 0));
      this.setCell(sheet, this.getCellID('J', nRow), this.getCellID('G', nRow), cStyle, 
        this.getNumberString(this.getTotal('aborted', exp, missionMap, sensorList), 0));

      this.systeminfo.platforms?.forEach(plat => {
        const key = `${exp.toUpperCase()}|${plat.id}`;
        const mtype = missionMap.get(key);
        if (plat.use(exp, rptType)) {
          nRow++;
          let platCount = -1;
          this.setCell(sheet, this.getCellID('B', nRow), this.getCellID('C', nRow), prStyle, 
          plat.id);
          plat.sensors.forEach(pSen => {
            if (pSen.use(exp, rptType)) {
              platCount++;
              if (platCount <= 0) {
                this.setCell(sheet, this.getCellID('D', nRow + platCount),
                  this.getCellID('F', nRow + platCount), prStyle, pSen.id);
              } else {
                this.setCell(sheet, this.getCellID('B', nRow + platCount),
                  this.getCellID('F', nRow + platCount), prStyle, pSen.id);
              }
              this.setCell(sheet, this.getCellID('G', nRow + platCount), 
                this.getCellID('G', nRow + platCount), prdStyle, 
                this.getNumberString(this.getTotal('scheduled', exp, missionMap, 
                  [pSen.id]), 0));
              this.setCell(sheet, this.getCellID('H', nRow + platCount), 
                this.getCellID('H', nRow + platCount), prdStyle, 
                this.getNumberString(this.getTotal('executed', exp, missionMap, 
                  [pSen.id]), 0));
              this.setCell(sheet, this.getCellID('I', nRow + platCount), 
                this.getCellID('I', nRow + platCount), prdStyle, 
                this.getNumberString(this.getTotal('cancelled', exp, missionMap, 
                  [pSen.id]), 0));
              this.setCell(sheet, this.getCellID('J', nRow + platCount), 
                this.getCellID('J', nRow + platCount), prdStyle, 
                this.getNumberString(this.getTotal('aborted', exp, missionMap, 
                  [pSen.id]), 0));
            }
          });
          nRow += platCount;
        }
      });
    });

    // create ground systems matrix
    // displayed ground systems are determined by report type
    nRow += 2;
    style = {
      border: this.borders.get('blackthin'),
      fill: this.fills.get('plathead'),
      font: this.fonts.get('bold9'),
      alignment: this.alignments.get('leftctr')
    };
    this.setCell(sheet, this.getCellID('B', nRow), this.getCellID('D', nRow+1), style, 
      "Ground System/Enclave");
    this.setCell(sheet, this.getCellID('E', nRow), this.getCellID('H', nRow), style, 
      "HOURS");
    this.setCell(sheet, this.getCellID('I', nRow), this.getCellID('J', nRow), style, 
      "Outages");
    this.setCell(sheet, this.getCellID('K', nRow), this.getCellID('K', nRow), style, 
      "Ao%");
    nRow++;
    this.setCell(sheet, this.getCellID('E', nRow), this.getCellID('E', nRow), style, 
      "PRE");
    this.setCell(sheet, this.getCellID('F', nRow), this.getCellID('F', nRow), style, 
      "PLAN");
    this.setCell(sheet, this.getCellID('G', nRow), this.getCellID('G', nRow), style, 
      "EXEC");
    this.setCell(sheet, this.getCellID('H', nRow), this.getCellID('H', nRow), style, 
      "POST");
    this.setCell(sheet, this.getCellID('I', nRow), this.getCellID('I', nRow), style, 
      "#");
    this.setCell(sheet, this.getCellID('J', nRow), this.getCellID('J', nRow), style, 
      "HOURS");

    if (this.systeminfo.groundSystems) {
      this.systeminfo.groundSystems.forEach(gs => {
        if (rptType === GeneralTypes.ALL 
          || (rptType === GeneralTypes.GEOINT && gs.showOnGEOINT)
          || (rptType === GeneralTypes.SYERS && gs.showOnGSEG)
          || (rptType === GeneralTypes.MIST && gs.showOnMIST)
          || (rptType === GeneralTypes.XINT && gs.showOnXINT)
        ) {
          let encCount = -1;
          nRow++;
          gs.enclaves.forEach(enclave => {
            let premission = 0;
            let scheduled = 0;
            let executed = 0;
            let postmission = 0;
            let overlap = 0;
            let outageNumber = 0;
            let outageTime = 0;
            for (const [key, mtype] of missionMap) {
              premission += mtype.getPremissionTime(sensors, enclave, gs);
              scheduled += mtype.getScheduledTime(sensors, enclave, gs);
              executed += mtype.getExecutedTime(sensors, enclave, gs);
              postmission += mtype.getPostmissionTime(sensors, enclave, gs);
              overlap += mtype.getOverlap();
            }
            if (executed >= overlap && overlap > 0) {
              executed -= overlap;
            } else if (executed < overlap) {
              executed = 0;
            }
            encCount++;
            outageNumber = 0;
            outageTime = 0;
            if (gs.enclaves.length === 1) {
              style = {
                border: this.borders.get('blackthinNoRight'),
                fill: this.fills.get('platsen'),
                font: this.fonts.get('bold9'),
                alignment: this.alignments.get('center')
              };
              this.setCell(sheet, this.getCellID("B", nRow), this.getCellID("C", nRow),
                style, gs.id);
              style = {
                border: this.borders.get('blackthinNoLeft'),
                fill: this.fills.get('platsen'),
                font: this.fonts.get('bold9'),
                alignment: this.alignments.get('center')
              };
              this.setCell(sheet, this.getCellID("B", nRow), this.getCellID("C", nRow),
                style, "");
            } else {
              if (encCount === 0) {
                style = {
                  border: this.borders.get('blackthin'),
                  fill: this.fills.get('platsen'),
                  font: this.fonts.get('bold9'),
                  alignment: this.alignments.get('center')
                };
                this.setCell(sheet, this.getCellID("B", nRow), this.getCellID("C", nRow), 
                  style, gs.id);
                style = {
                  border: this.borders.get('blackthin'),
                  fill: this.fills.get('platsen'),
                  font: this.fonts.get('bold9'),
                  alignment: this.alignments.get('rightctr')
                };
                this.setCell(sheet, this.getCellID("D", nRow), this.getCellID("D", nRow), 
                  style, enclave);
              } else {
                style = {
                  border: this.borders.get('blackthin'),
                  fill: this.fills.get('platsen'),
                  font: this.fonts.get('bold9'),
                  alignment: this.alignments.get('rightctr')
                };
                this.setCell(sheet, this.getCellID("B", nRow+encCount), 
                  this.getCellID("D", nRow+encCount), style, enclave);
              }
            }
            style = {
              border: this.borders.get('blackthin'),
              fill: this.fills.get('platsen'),
              font: this.fonts.get('bold9'),
              alignment: this.alignments.get('rightctr')
            };
            this.setCell(sheet, this.getCellID("E", nRow+encCount), 
              this.getCellID("E", nRow+encCount), style, this.getTimeString(premission));
            this.setCell(sheet, this.getCellID("F", nRow+encCount), 
              this.getCellID("F", nRow+encCount), style, this.getTimeString(scheduled));
            this.setCell(sheet, this.getCellID("G", nRow+encCount), 
              this.getCellID("G", nRow+encCount), style, this.getTimeString(executed));
            this.setCell(sheet, this.getCellID("H", nRow+encCount), 
              this.getCellID("H", nRow+encCount), style, this.getTimeString(postmission));

            outages.forEach(outage => {
              if (outage.groundSystem.toLowerCase() === gs.id.toLowerCase() 
                && outage.classification.toLowerCase() === enclave.toLowerCase()) {
                outageNumber++;
                outageTime += outage.outageMinutes;
              }
            });

            let ao = 0.0;
            if (executed > 0) {
              ao = ((executed = outageTime) / executed) * 100.0;
            }
            if (ao > 0 && ao < 100) {
              style.font = this.fonts.get("notnorm");
            }
            this.setCell(sheet, this.getCellID("I", nRow+encCount), 
              this.getCellID("I", nRow+encCount), style, `${outageNumber}`);
            this.setCell(sheet, this.getCellID("J", nRow+encCount), 
              this.getCellID("J", nRow+encCount), style, this.getTimeString(outageTime));
            this.setCell(sheet, this.getCellID("K", nRow+encCount), 
              this.getCellID("K", nRow+encCount), style, ao, '0.00');
          });
          nRow += encCount;
        }
      });
      const delta = end.getTime() - start.getTime();
      if (rptType === GeneralTypes.ALL && delta > (24 * 3600000)) {
        this.createSummarySheet(workbook, start, end, false, GeneralTypes.GEOINT, "GEOINT")
      }
      if (bDaily) {
        let dayStart = new Date(start);
        while (dayStart.getTime() < end.getTime()) {
          const dayEnd = new Date((dayStart.getTime() + (24 * 3600000)) - 1000);
          this.createSummarySheet(workbook, dayStart, dayEnd, false, rptType, '');
          dayStart = new Date(dayStart.getTime() + (24 * 3600000));
        }
      }
    }
  }

  getTotal(type: string, exploit: string, missionMap:Map<string, MissionType>, 
    sensors: string[]): number {
    let answer = 0;
    for (const [key, mtype] of missionMap) {
      switch (type.toLowerCase()) {
        case "scheduled":
          answer += mtype.getScheduled(exploit, sensors);
          break;
        case "executed":
          answer += mtype.getExecuted(exploit, sensors);
          break;
        case "cancelled":
          answer += mtype.getCancelled(exploit, sensors);
          break;
        case "aborded":
          answer += mtype.getAborted(exploit, sensors);
          break;
      }
    }
    return answer;
  }
}