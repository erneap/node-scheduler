import { mdbConnection } from "scheduler-node-models/config";
import { PoolConnection } from 'mariadb';
import { Contact, Team } from "scheduler-node-models/scheduler/teams";
import { Workcode } from "scheduler-node-models/scheduler/labor";

export class BuildTeams {
  private teams: Team[];

  constructor() {
    this.teams = [];
  }

  async build(): Promise<Team[]> {
    this.teams = [];
    let conn: PoolConnection | undefined
    const start = new Date();
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        // get the teams
        let sql = "SELECT * FROM teams ORDER BY name;";
        let results = await conn?.query(sql);
        let resultPromises = results.map((row: any) => {
          const team = new Team();
          team.id = row.id;
          team.name = row.name;
          this.teams.push(team);
        });
        await Promise.allSettled(resultPromises);
        // get the team workcodes
        sql = "SELECT * FROM teams_workcodes ORDER BY teamid, id;";
        results = await conn?.query(sql);
        resultPromises = results.map((row: any) => {
          const teamid = row.teamid;
          this.teams.forEach((team, t) => {
            if (team.id === teamid) {
              team.workcodes.push(new Workcode({
                id: row.id,
                title: row.title,
                start: row.start,
                shiftCode: row.shiftCode,
                isLeave: (row.isLeave === 1),
                textcolor: row.textcolor,
                backcolor: row.backcolor,
                altcode: row.altcode,
                search: row.search
              }));
              this.teams[t] = team;
            }
          });
        });
        await Promise.allSettled(resultPromises);
        // get the team contact types
        sql = "SELECT * FROM teams_workcodes WHERE datatype='contact' ORDER BY teamid, id;";
        results = await conn?.query(sql);
        resultPromises = results.map((row: any) => {
          const teamid = row.teamid;
          this.teams.forEach((team, t) => {
            if (team.id === teamid) {
              team.contacttypes.push(new Contact({
                id: row.id,
                name: row.name,
                sort: row.sort
              }));
              this.teams[t] = team;
            }
          })
        });
        await Promise.allSettled(resultPromises);
        // get the team specialty types
        // get the team companys
        // get the team company holidays/actuals
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) conn.release();
    }
    const end = new Date();
    console.log(`${end.getTime() - start.getTime()}ms`);
    return this.teams;
  }
}