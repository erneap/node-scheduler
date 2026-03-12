import { ISite, Site } from "scheduler-node-models/scheduler/sites";

export class SqlSites {
  private teamid: string;
  private sites: Site[];

  constructor(teamid: string, sites: ISite[]) {
    this.teamid = teamid;
    this.sites = [];
    sites.forEach(site => {
      this.sites.push(new Site(site));
    });
    this.sites.sort((a,b) => a.compareTo(b));
  }
}