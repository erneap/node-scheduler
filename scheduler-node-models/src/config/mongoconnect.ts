import { MongoClient, Db, Collection } from 'mongodb';

export const collections: { 
  users?: Collection, 
  employees?: Collection,
  work?: Collection,
  notifications?: Collection,
  teams?: Collection,
  help?: Collection,
  missions?: Collection,
  outages?: Collection
} = {}

export async function connectToDB() {
  const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@`
    + `${process.env.MONGO_SERVER}:${process.env.MONGO_PORT}?`
    + `${process.env.MONGO_APPEND}`;
  if (uri) {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      console.log('Connected to database');
      
      const db: Db = client.db('scheduler');
      let users: Collection = client.db('authenticate').collection("users");
      if (!users) {
        users = await db.createCollection("users");
      }
      collections.users = users;
      let employees: Collection = db.collection("employees");
      if (!employees) {
        employees = await db.createCollection("employees");
      }
      collections.employees = employees;
      let work: Collection = db.collection('employeework');
      if (!work) {
        work = await db.createCollection("employeework");
      }
      collections.work = work;
      let notifications: Collection = db.collection("notifications");
      if (!notifications) {
        notifications = await db.createCollection("notifications");
      }
      collections.notifications = notifications;
      let teams = await db.collection('teams');
      if (!teams) {
        teams = await db.createCollection('teams');
      }
      collections.teams = teams;
      let help = await db.collection('help');
      if (!help) {
        help = await db.createCollection('help');
      }
      collections.help = help;

      // set up the metrics database and collection tables
      const metricsDB: Db = client.db('metrics2');
      let missions: Collection = metricsDB.collection('missions');
      if (!missions) {
        missions = await db.createCollection('missions');
      }
      collections.missions = missions;
      let outages: Collection = metricsDB.collection('outages');
      if (!outages) {
        outages = await metricsDB.createCollection('outages');
      }
      collections.outages = outages;
      console.log('Successfully connected to collections');
    } catch (error) {
      console.log(error);
    }
  }
}