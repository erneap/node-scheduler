import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { Site } from "scheduler-models/scheduler/sites";
import { ScheduleDay, ScheduleEmployee, ScheduleWorkcenter } from 'scheduler-models/scheduler/sites/schedule'
import { BuildInitial, postLogEntry } from "scheduler-services";

const router = Router();
export default router;

/**
 * This method will be used to get the current site information for the account logged
 * in as.  This is part of the user's information, so it will be obtained from the user's
 * identifier.
 */
router.get('/site/schedule/schedule/:id/:month', auth, async(req: Request, res: Response) => {
  try {
    const userid = req.params.id as string;
    const sMonth = req.params.month as string;
    if (userid && sMonth) {
      const start = new Date(Number(sMonth));
      const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
      const build = new BuildInitial(userid);
      const initial = await build.build();
      if (initial.site) {
        const site = new Site(initial.site);
        site.workcenters.forEach(wkctr => {
          wkctr.clearEmployees();
        });

        if (site.employees) {
          site.employees.forEach(iEmp => {
            if (iEmp.atSite(site.id, start, end)) {
              site.assign(iEmp, start, end);
            }
          })
        }
        const answer: ScheduleWorkcenter[] = [];
        let wcCount = 0;
        site.workcenters.forEach((wkctr, w) => {
          const sWc = new ScheduleWorkcenter({
            id: wcCount++,
            name: wkctr.name,
            employees: []
          });
          answer.push(sWc);
          let empCount = 0;
          if (wkctr.positions && wkctr.positions.length > 0) {
            wkctr.positions.forEach(posit => {
              if (posit.employees && posit.employees.length > 0) {
                posit.employees.forEach(iEmp => {
                  const sEmp = new ScheduleEmployee({
                    id: empCount++,
                    name: iEmp.name.getLastFirst(),
                    days: []
                  });
                  let daysCount = 0;
                  let eStart = new Date(start);
                  while (eStart.getTime() < end.getTime()) {
                    const wd = iEmp.getWorkday(eStart);
                    daysCount++;
                    sEmp.days.push(new ScheduleDay({
                      id: daysCount,
                      code: (wd) ? wd.code : ''
                    }));
                    eStart = new Date(eStart.getTime() + (24 * 3600000));
                  }
                  sWc.employees.push(sEmp);
                });
              }
            })
          }
          if (wkctr.shifts && wkctr.shifts.length > 0) {
            wkctr.shifts.forEach(shft => {
              if (shft.employees && shft.employees.length > 0) {
                shft.employees.forEach(iEmp => {
                  const sEmp = new ScheduleEmployee({
                    id: empCount++,
                    name: iEmp.name.getLastFirst(),
                    days: []
                  });
                  let daysCount = 0;
                  let eStart = new Date(start);
                  while (eStart.getTime() < end.getTime()) {
                    const wd = iEmp.getWorkday(eStart);
                    daysCount++;
                    sEmp.days.push(new ScheduleDay({
                      id: daysCount,
                      code: (wd) ? wd.code : ''
                    }));
                    eStart = new Date(eStart.getTime() + (24 * 3600000));
                  }
                  sWc.employees.push(sEmp);
                });
              }
            })
          }
        });
        res.status(200).json(answer);
      } else {
        throw new Error('Site not provided')
      }
    } else {
      throw new Error('No User ID provided');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `site: Get: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});