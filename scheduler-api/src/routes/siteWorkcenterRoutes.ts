import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { logConnection, collections } from "scheduler-node-models/config";
import { getAllDatabaseInfo, getEmployee } from "./initialRoutes";
import { NewSiteWorkcenter, WorkcenterUpdate } from 'scheduler-node-models/scheduler/sites/web';
import { Site } from "scheduler-node-models/scheduler/sites";
import { ObjectId } from "mongodb";
import { Employee } from "scheduler-node-models/scheduler/employees";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";
import { Workcenter } from "scheduler-node-models/scheduler/sites/workcenters/workcenter";

const router = Router();
export default router;

/**
 * The actions for workcenter maintenance is to add a new workcenter, update a workcenter,
 * and to delete a workcenter.  A part of updating is to add, update, and delete both
 * positions and shifts within a workcenter, plus assign and remove individuals to/from
 * positions.
 */

/**
 * This method will create a new workcenter for the site.  The passed data includes the
 * teamid, siteid, workcenter id and name.
 */
router.post('/site/workcenter', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as NewSiteWorkcenter;
    const now = new Date();
    const begin = new Date(Date.UTC(now.getFullYear() - 1, 1, 1));
    const initial = await getAllDatabaseInfo(data.teamid, data.siteid, begin, now);
    if (initial && initial.team && initial.site) {
      let sort = -1;
      let found = false;
      if (initial.site.workcenters) {
        initial.site.workcenters.forEach(wc => {
          if (wc.id.toLowerCase() === data.id.toLowerCase()) {
            found = true;
          }
          if (wc.sort > sort) {
            sort = wc.sort;
          }
        });
        if (!found) {
          initial.site.workcenters.push(new Workcenter({
            id: data.id.toLowerCase(),
            name: data.name,
            sort: sort + 1
          }));
        } else {
          throw new Error('Requested new workcenter - duplicate identifier');
        }
      } else {
        initial.site.workcenters = [];
        initial.site.workcenters.push(new Workcenter({
          id: data.id.toLowerCase(),
          name: data.name,
          sort: 0
        }));
      }
      // to update the database, we need to remove the employees from the site, yet 
      // retain the employees for the return value (site).  So, we will create a new site
      // object, then replace the site in the team and save this to the database.  Then,
      // return the original site object.
      const site = new Site(initial.site);
      site.employees = [];
      initial.team.sites.forEach((s, pos) => {
        if (s.id.toLowerCase() === initial.site.id.toLowerCase()) {
          initial.team.sites[pos] = site;
        }
      });
      if (collections.teams) {
        const query = { _id: new ObjectId(initial.team.id)};
        await collections.teams.replaceOne(query, initial.team)
      } else {
        throw new Error('No team collection to update')
      }
      res.status(200).json(initial.site);
    } else {
      throw new Error('No initial data from team/site.')
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

/**
 * This method will be used to update a workcenter, workcenter position, or workcenter
 * shift.  
 */
router.put('/site/workcenter', auth, async(req: Request, res: Response) => {
  try {
    const data = req.body as WorkcenterUpdate;
    const now = new Date();
    const begin = new Date(Date.UTC(now.getFullYear() - 1, 1, 1));
    const initial = await getAllDatabaseInfo(data.teamid, data.siteid, begin, now);
    if (initial && initial.team && initial.site) {
      const site = new Site(initial.site);
      // find the workcenter that is to be updated
      if (site.workcenters) {
        site.workcenters.forEach((wc, pos) => {
          if (wc.id.toLowerCase() === data.workcenterid.toLowerCase()) {
            // if the shift/position id isn't blank the field/value will update the 
            // shift/position
            if (data.shiftPosid && data.shiftPosid !== '') {
              // since the workcenter can contain positions and/or shifts, the data's 
              // shiftpos will tell which to update
              if (data.shiftPos && data.shiftPos?.toLowerCase() === 'shift') {
                if (wc.shifts) {
                  wc.shifts.sort((a,b) => a.compareTo(b))
                  wc.shifts.forEach((shift, spos) => {
                    if (shift.id.toLowerCase() === data.shiftPosid?.toLowerCase()) {
                      switch (data.field.toLowerCase()) {
                        case "remove":
                          if (wc.shifts) {
                            wc.shifts.splice(spos);
                          }
                          break;
                        case "id":
                          shift.id = data.value.toLowerCase();
                          break;
                        case "name":
                          shift.name = data.value;
                          break;
                        case "associated":
                        case "associatedcodes":
                        case "codes":
                          shift.associatedCodes = data.value.split(',');
                          break;
                        case "paycode":
                        case "premimum":
                          shift.payCode = Number(data.value);
                          break;
                        case "minimums":
                          shift.minimums = Number(data.value);
                          break;
                        case "move":
                          if (wc.shifts) {
                            if (data.value.toLowerCase() === 'up') {
                              if (spos > 0) {
                                const tsort = wc.shifts[spos - 1].sort;
                                wc.shifts[spos - 1].sort = shift.sort;
                                shift.sort = tsort;
                              }
                            } else {
                              if (spos < wc.shifts.length - 1) {
                                const tsort = wc.shifts[spos + 1].sort;
                                wc.shifts[spos + 1].sort = shift.sort;
                                shift.sort = tsort;
                              }
                            }
                          }
                          break;
                      }
                      if (wc.shifts && data.field.toLowerCase() !== 'remove') {
                        wc.shifts[spos] = shift;
                      }
                    }
                  })
                }
              } else {
                if (wc.positions) {
                  wc.positions.sort((a,b) => a.compareTo(b));
                  wc.positions.forEach((posit, ppos) => {
                    if (posit.id.toLowerCase() === data.shiftPosid?.toLowerCase()) {
                      switch (data.field.toLowerCase()) {
                        case "remove":
                          if (wc.positions) {
                            wc.positions.splice(ppos, 1);
                          }
                          break;
                        case "id":
                          posit.id = data.value.toLowerCase();
                          break;
                        case "name":
                          posit.name = data.value;
                          break;
                        case "addassigned":
                          if (posit.assigned) {
                            let found = false;
                            posit.assigned.forEach(asgn => {
                              if (asgn.toLowerCase() === data.value.toLowerCase()) {
                                found = true;
                              }
                            });
                            if (!found) {
                              posit.assigned.push(data.value);
                            }
                          } else {
                            posit.assigned = [];
                            posit.assigned.push(data.value);
                          }
                          break;
                        case "removeassigned":
                          if (posit.assigned) {
                            let found = -1;
                            posit.assigned.forEach((asgn, a) => {
                              if (asgn.toLowerCase() === data.value.toLowerCase()) {
                                found = a;
                              }
                            });
                            posit.assigned.splice(found, 1);
                          }
                          break;
                        case "move":
                          if (wc.positions) {
                            if (data.value.toLowerCase() === 'up') {
                              if (ppos > 0) {
                                const tsort = wc.positions[ppos - 1].sort;
                                wc.positions[ppos - 1].sort = posit.sort;
                                posit.sort = tsort;
                              }
                            } else {
                              if (ppos < wc.positions.length - 1) {
                                const tsort = wc.positions[ppos + 1].sort;
                                wc.positions[ppos + 1].sort = posit.sort;
                                posit.sort = tsort;
                              }
                            }
                          }
                      }
                      if (wc.positions && data.field.toLowerCase() !== 'remove') {
                        wc.positions[ppos] = posit;
                      }
                    }
                  });
                }
              }
            } else {
              // otherwise the update is for the workcenter instead.
              switch (data.field.toLowerCase()) {
                case "id":
                  wc.id = data.value.toLowerCase();
                  break;
                case "name":
                  wc.name = data.value;
                  break;
                case "move":
                  if (site.workcenters) {
                    site.workcenters.sort((a,b) => a.compareTo(b));
                    if (data.value.toLowerCase() === 'up') {
                      if (pos > 0) {
                        const tsort = site.workcenters[pos-1].sort;
                        site.workcenters[pos-1].sort = wc.sort;
                        wc.sort = tsort;
                      }
                    } else {
                      if (pos < site.workcenters.length - 1) {
                        const tsort = site.workcenters[pos + 1].sort;
                        site.workcenters[pos+1].sort = wc.sort;
                        wc.sort = tsort;
                      }
                    }
                  }
              }
            }
          }
          if (site.workcenters) {
            site.workcenters[pos] = wc;
          }
        });
        // since the changes have been made, we need to update the site in the team, minus
        // the employees list for the site, then push the team to the database.
        const team = new Team(initial.team);
        const uSite = new Site(site);
        uSite.employees = undefined;
        team.sites.forEach((s, spos) => {
          if (uSite.id.toLowerCase() === s.id.toLowerCase()) {
            team.sites[spos] = uSite;
          }
        });
        if (collections.teams) {
          const query = { _id: new ObjectId(team.id)};
          await collections.teams.replaceOne(query, team);
        }
        res.status(200).json(site);
      } else {
        throw new Error('No workcenters in site')
      }
    } else {
      throw new Error('No initial data from team/site.')
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});

router.delete('/site/workcenter/:team/:site/:workcenter', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const siteid = req.params.site as string;
    const wcID = req.params.workcenter as string;
    if (teamid && siteid && wcID) {
      
    }
  } catch (err) {
    const error = err as Error;
    if (logConnection.log) {
      logConnection.log.log(`Error: ${error.message}`);
    }
    res.status(400).json({'message': error.message});
  }
});