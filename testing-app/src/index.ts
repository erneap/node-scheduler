import dotenv from 'dotenv';
import { collections, connectToDB } from './config/mongoconnect';
import { Collection, ObjectId } from 'mongodb';
import { ITeam, Team } from 'scheduler-node-models/scheduler/teams';
import { SAPIngest } from 'scheduler-node-models/scheduler/ingest'
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const main = async() => {
  await connectToDB();

  const teamCol: Collection | undefined = collections.teams;
  const teamID = '64dad6b14952737d1eb2193f';

  try {
    if (teamCol) {
      const query = { _id: new ObjectId(teamID)};
      const iTeam = await teamCol.findOne<ITeam>(query);
      if (iTeam && iTeam !== null) {
        const team = new Team(iTeam);
        const files: File[] = [];

        const filelist = [ 'export20251130162131_VYD-1128.xlsx', 
          'export20251128232550_RBT.xlsx', 'export20251130165124_VYD_CofS.xlsx',
          'export20251201203932_Chris.xlsx'
        ]

        const basePath = '/Users/antonerne/Downloads';
        const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filelist.forEach(fileName => {
          const filePath = path.join(basePath, fileName);
          const fileBuffer = fs.readFileSync(filePath);

          const file = new File([fileBuffer], fileName, 
            { type: mimeType, 
              lastModified: fs.statSync(filePath).mtimeMs });
          files.push(file);
        });

        
        const ingest = new SAPIngest(files, team);
        ingest.team = team;
        const result = await ingest.Process();

        result.forEach(row => {
          console.log(row.toString());
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
  process.exit(0);
}

main();