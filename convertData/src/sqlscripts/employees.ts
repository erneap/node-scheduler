import { ObjectId } from "mongodb";
import { IEmployee } from "scheduler-models/scheduler/employees";
import { collections } from "scheduler-services";

export class EmployeeConvert {
  constructor() {}

  async convert() {
    try {
      if (collections.employees) {
        const teamid = '64dad6b14952737d1eb2193f';
        const query = {};
        const empCursor = collections.employees.find<IEmployee>(query);
        const empArray = await empCursor.toArray();
        const empPromises = empArray.map(async(iEmp) => {
          iEmp.team = teamid;
          if (collections.employees2) {
            const empQuery = {_id: iEmp._id};
            //const delResult = await collections.employees2.deleteOne(empQuery);
            console.log(`Adding ${iEmp.name.lastname}`);
            const result = await collections.employees2.insertOne(iEmp);
            console.log(result);
          } else {
            console.log('no collection');
          }
        });
        Promise.allSettled(empPromises);
      }
    } catch (err) {
      console.log(err);
    }
  }
}