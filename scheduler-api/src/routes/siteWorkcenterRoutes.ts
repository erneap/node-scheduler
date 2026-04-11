import { Request, Response, Router } from "express";
import { auth } from '../middleware/authorization.middleware';
import { NewSiteWorkcenter, WorkcenterUpdate } from 'scheduler-models/scheduler/sites/web';
import { Site } from "scheduler-models/scheduler/sites";
import { Team } from "scheduler-models/scheduler/teams";
import { Workcenter } from "scheduler-models/scheduler/sites/workcenters/workcenter";
import { postLogEntry, TeamService } from "scheduler-services";
import { Shift } from "scheduler-models/scheduler/sites/workcenters/shift";
import { Position } from "scheduler-models/scheduler/sites/workcenters/position";

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
    const teamService = new TeamService();
    const iTeam = await teamService.getTeam(data.teamid);
    if (iTeam) {
      const team = new Team(iTeam);
      let answer = new Site();
      team.sites.forEach((site, s) => {
        if (site.id.toLowerCase() === data.siteid.toLowerCase()) {
          let sort = -1;
          let found = false;
          if (!site.workcenters) {
            site.workcenters = [];
          }
          site.workcenters.forEach(wc => {
            if (wc.id.toLowerCase() === data.id.toLowerCase()) {
              found = true;
            }
            if (wc.sort > sort) {
              sort = wc.sort;
            }
          });
          if (!found) {
            site.workcenters.push(new Workcenter({
              id: data.id.toLowerCase(),
              name: data.name,
              sort: sort + 1
            }));
          } else {
            throw new Error("Duplicate: Workcenter not added.");
          }
          answer = new Site(site);
          team.sites[s] = site;
        }
      });
      await teamService.replaceTeam(team);
      res.status(200).json(answer);
    } else {
      throw new Error('Team not found');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `siteWorkcenter: Post: Error: ${error.message}`);
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
    const teamService = new TeamService();
    const iTeam = await teamService.getTeam(data.teamid);
    if (iTeam) {
      const team = new Team(iTeam);
      let answer = new Site();
      team.sites.forEach((site, s) => {
        if (site.id.toLowerCase() === data.siteid.toLowerCase()) {
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
                            shift.associatedCodes = data.value.split('|');
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
                          case "assigned":
                            const assigned = data.value.split('|');
                            posit.assigned = assigned;
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
                    break;
                  case "addshift":
                    let shftMax = -1;
                    if (!wc.shifts) {
                      wc.shifts = [];
                    }
                    wc.shifts.forEach(shft => {
                      if (shft.sort > shftMax) {
                        shftMax = shft.sort
                      }
                    });
                    const parts = data.value.split('|');
                    const newShift = new Shift();
                    newShift.id = parts[0].toLowerCase();
                    newShift.name = parts[1];
                    newShift.sort = shftMax + 1;
                    wc.shifts.push(newShift);
                    break;
                  case "addposition":
                    let posMax = -1;
                    if (!wc.positions) {
                      wc.positions = [];
                    }
                    wc.positions.forEach(pos => {
                      if (pos.sort > posMax) {
                        posMax = pos.sort;
                      }
                    });
                    const pparts = data.value.split('|');
                    const newPos = new Position();
                    newPos.id = pparts[0].toLowerCase();
                    newPos.name = pparts[1];
                    newPos.sort = posMax + 1;
                    wc.positions.push(newPos);
                    break;
                }
              }
            }
            if (site.workcenters) {
              site.workcenters[pos] = wc;
            }
          });
          answer = new Site(site);
          team.sites[s] = site;
        }
      });
      await teamService.replaceTeam(team);
      res.status(200).json(answer);
    } else {
      throw new Error('Team not found');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `siteWorkcenter: Put: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

router.delete('/site/workcenter/:team/:site/:workcenter', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const siteid = req.params.site as string;
    const wcID = req.params.workcenter as string;
    if (teamid !== '' && siteid !== '' && wcID !== '') {
      const teamService = new TeamService();
      const iTeam = await teamService.getTeam(teamid);
      if (iTeam) {
        const team = new Team(iTeam);
        let answer = new Site();
        team.sites.forEach((site, s) => {
          if (site.id.toLowerCase() === siteid.toLowerCase()) {
            let found = -1;
            site.workcenters.forEach((wc, w) => {
              if (wc.id.toLowerCase() === wcID.toLowerCase()) {
                found = w;
              }
            });
            if (found >= 0) {
              site.workcenters.splice(found, 1);
            }
            answer = new Site(site);
            team.sites[s] = site;
          }
        });
        await teamService.replaceTeam(team);
        res.status(200).json(answer);
      } else {
        throw new Error('Team not found');
      }
    } else {
      throw new Error('Team, Site, and/or workcenter not identified')
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `siteWorkcenter: Delete: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});