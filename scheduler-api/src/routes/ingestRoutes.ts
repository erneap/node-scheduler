import { Request, Response, Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from "scheduler-node-models/config";
import { IUser, User } from "scheduler-node-models/users";
import { auth } from '../middleware/authorization.middleware';
import { ManualExcelReport } from "../reports/mexcel";

const router = Router();

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
      const userQuery = { _id: new ObjectId(id)};
      if (collections.users) {
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

  }
});

router.post('/ingest', async(req: Request, res: Response) => {

});

export default router;