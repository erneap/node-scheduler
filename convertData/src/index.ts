import dotenv from 'dotenv';
import { connectToDB, createPool } from 'scheduler-node-models/config';
import { SqlUsers } from './sqlscripts/users';
import { SqlTeams } from './sqlscripts/teams';
import { BuildUsers } from './buildScripts/buildUsers';
/**
 * This project portion will convert the original data from mongodb to mariadb.
 * 
 * This will be complete in steps:
 * 1) Ensure mariadb scheduler tables exist or are created.
 * 2) Read the user data from the mongodb.
 */

(async() => {
  await dotenv.config();
  await connectToDB();
  await createPool();

  const users = new SqlUsers();
  const records = await users.runConvert();
  console.log(`Users: ${records}`);

  const teams = new SqlTeams();
  const teamrecs = await teams.runConvert();
  console.log(`Teams: ${teamrecs}`);

  const bUsers = new BuildUsers();
  await bUsers.build();

})();
