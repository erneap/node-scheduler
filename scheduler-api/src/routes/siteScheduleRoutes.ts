import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { Site } from "scheduler-models/scheduler/sites";
import { MidListItem, ScheduleDay, ScheduleEmployee, ScheduleShift, ScheduleWorkcenter } 
  from 'scheduler-models/scheduler/sites/schedule'
import { BuildInitial, postLogEntry } from "scheduler-services";
import { Employee } from "scheduler-models/scheduler/employees";

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
            wkctrID: wkctr.id,
            name: wkctr.name,
            employees: [],
            shifts: []
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
            let shftcount = 0;
            wkctr.shifts.forEach(shft => {
              const schShft = new ScheduleShift({
                id: shftcount++,
                name: shft.name,
                codes: shft.associatedCodes,
                minimums: shft.minimums,
                counts: []
              });
              schShft.setCounts(start);
              sWc.shifts.push(schShft);
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
        answer.forEach(wkctr => {
          if (wkctr.employees.length > 0 && wkctr.shifts.length > 0) {
            wkctr.shifts.forEach(shft => {
              wkctr.employees.forEach(emp => {
                emp.days.forEach(day => {
                  if (shft.hasCode(day.code)) {
                    shft.counts[day.id - 1].increment();
                  }
                })
              });
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

/**
 * This method will be used to get the current site information for the account logged
 * in as.  This is part of the user's information, so it will be obtained from the user's
 * identifier.
 */
router.get('/site/schedule/mids/:id/:year', auth, async(req: Request, res: Response) => {
  try {
    const userid = req.params.id as string;
    const sYear = req.params.year as string;
    if (userid && sYear) {
      const start = new Date(Date.UTC(Number(sYear), 0, 1));
      const end = new Date(Date.UTC(start.getUTCFullYear() + 1, 0, 1));
      const build = new BuildInitial(userid);
      const initial = await build.build();
      if (initial.site) {
        const site = new Site(initial.site);
        const answer: MidListItem[] = [];
        if (site.employees) {
          site.employees.forEach(iEmp => {
            const emp = new Employee(iEmp);
            if (emp.atSite(site.id, start, end)) {
              emp.variations.forEach(vari => {
                if (vari.startdate.getTime() < end.getTime()
                  && vari.enddate.getTime() >= start.getTime()
                  && vari.mids) {
                  const mlItem = new MidListItem({
                    name: emp.name.getLastFirst(),
                    start: new Date(vari.startdate),
                    end: new Date(vari.enddate)
                  });
                  answer.push(mlItem);
                }
              });
            }
          });
        }
        answer.sort((a,b) => a.compareTo(b));
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