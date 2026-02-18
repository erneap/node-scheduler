import { Request, Response, Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from "scheduler-node-models/config";
import { IUser, User } from "scheduler-node-models/users";
import { auth } from '../middleware/authorization.middleware';
import { ManualExcelReport } from "../reports/mexcel";
import { logConnection } from "scheduler-node-models/config";
import multer from 'multer';
import { Site } from "scheduler-node-models/scheduler/sites";
import { getAllDatabaseInfo } from "./initialRoutes";
import { ExcelRow, SAPIngest, ExcelRowIngest, ExcelRowPeriod } from 'scheduler-node-models/scheduler/ingest'
import { Employee, Work, WorkRecord } from "scheduler-node-models/scheduler/employees";

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({storage: storage });

/**
 * This method will be used to download a mexcel (manual excel) file so that the on-site
 * company supervisor can provide the work hours and leave codes for each day of the 
 * month, and will show the total work hours for the month.
 * Steps:
 * 1) Get the team, site and company identifiers, and month for the report as a date 
 *  object
 * 2) Create report object (mexcel) from the information
 * 3) Create excel workbook with the report object.
 * 4) Send the workbook as a download.
 */
router.get('/ingest/:team/:site/:company/:date', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const siteid = req.params.site as string;
    const companyid = req.params.company as string;
    const sDate = req.params.date as string;
    if (teamid && siteid && companyid && sDate) {
      const date = new Date(Date.parse(sDate));
      const formatter = Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric'
      });
      // all excel report need the requesting user to be identified, if possible
      let user = new User();
      let id = ''
      if ((req as any).user) {
        id = (req as any).user as string
      } 
      if (collections.users && id !== '') {
        const userQuery = { _id: new ObjectId(id)};
        const iUser = await collections.users.findOne<IUser>(userQuery);
        if (iUser) {
          user = new User(iUser);
        }
      }
      var report = new ManualExcelReport();
      let rptname = `${companyid.toUpperCase()}-${formatter.format(date)}.xlsx`;
      let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const workbook = await report.create(user, date, teamid, siteid, companyid);
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({
        'Content-Description': 'File Transfer',
        'Content-Disposition': `attachment; filename=${rptname}`,
        'Content-Type': contentType
      });
      res.status(200).send(buffer);
    } else {
      throw new Error('creation data missing');
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: GetManualIngestFile: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

router.post('/ingest', upload.array('files'), async(req: Request, res: Response) => {
  try {
    // ensure the upload file is present
    const files = req.files as Express.Multer.File[];

    if (!files) {
      throw new Error('No files uploaded')
    }

    // if files are present, get the other data to determine the type of ingest that will
    // be performed, either SAP or manual excel ingest.  This is based on team, site, and
    // company for the ingest.  The last value gives the month and year for manual excel
    // ingest, which allows the program to set the day of the month for the column data.
    const teamid = req.body.teamid as string;
    const siteid = req.body.siteid as string;
    const companyid = req.body.companyid as string;
    const sDate = req.body.date as string;
    if (!teamid || teamid === '') {
      throw new Error('No team identifier given');
    }
    if (!siteid || siteid === '') {
      throw new Error('No site identifier given');
    }
    if (!companyid || companyid === '') {
      throw new Error('No company identifer given');
    }

    // pull the team object to determine the method used for ingest of work data.
    let ingestMethod = 'mexcel';
    let site: Site = new Site();
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));
    const initial = await getAllDatabaseInfo(teamid, siteid, start, end);
    if (initial.team.companies) {
      initial.team.companies.forEach(co => {
        if (co.id.toLowerCase() === companyid.toLowerCase()) {
          ingestMethod = co.ingest;
        }
      });
    }
    const results: ExcelRowPeriod[] = [];
    switch (ingestMethod.toLowerCase().trim()) {
      case "sap":
        const sapIngest = new SAPIngest(files, initial.team);
        const periods = await sapIngest.Process();
        periods.forEach(period => {
          results.push(new ExcelRowPeriod(period));
        });
        break;
      case "mexcel":
        const excelIngest = new ExcelRowIngest(new Date(sDate), files, 
          initial.team, initial.site, companyid);
        const prds = await excelIngest.Process();
        prds.forEach(period => {
          results.push(new ExcelRowPeriod(period));
        });
        break;
    }
    if (results.length > 0) {
      const employees: Employee[] = [];
      const employeeWork: WorkRecord[] = [];
      
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: IngestFiles: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

export default router;