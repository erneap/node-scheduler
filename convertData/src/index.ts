import dotenv from 'dotenv';
import { connectToDB, createPool, BuildInitial } from 'scheduler-services';
import { SqlWork } from './sqlscripts/work';
import { EmployeeConvert } from './sqlscripts/employees';
/**
 * This project portion will convert the original data from mongodb to mariadb.
 * 
 * This will be complete in steps:
 * 1) Ensure mariadb scheduler tables exist or are created.
 * 2) Read the user data from the mongodb.
 */

async function convert() {
  console.log('Converting Data from Mongo to Mariadb')
  const work = new SqlWork();
  await work.runConvert();
}

async function build() {
  console.log('Building initial data from Mongo and MariaDB');
  const build = new BuildInitial('63a39b8255247905bd993e1f');
  const initial = await build.build();
  if (initial.employee && initial.employee.work) {
    console.log(`Employees Work: ${initial.employee.work.length}`);
  } else {
    console.log('Error on build');
  }
}

async function convertEmployees() {
  console.log('Converting employees to string team');
  const convert = new EmployeeConvert();
  Promise.allSettled([await convert.convert()]);
}

(async() => {
  await dotenv.config();
  await connectToDB();
  await createPool();

  const promises = process.argv.map(async(arg) => {
    switch (arg.toLowerCase()) {
      case "convert":
        await convert();
        break;
      case "build":
        await build();
        break;
      case "employees":
        await convertEmployees();
        break;
      default:
        console.log(`Unknown Argument: ${arg}`);
    }
  });
  await Promise.allSettled(promises);
  process.exit(0);
})();