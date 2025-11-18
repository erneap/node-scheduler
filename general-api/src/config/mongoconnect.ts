import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';

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
  dotenv.config();
  const uri = process.env.MONGO_URI;
  if (uri) {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      console.log('Connected to database');
      
      const db: Db = client.db('scheduler');
      let users: Collection = await client.db('authenticate').collection("users");
      if (!users) {
        users = await db.createCollection("users");
      }
      collections.users = users;
      let employees: Collection = await db.collection("employees");
      if (!employees) {
        employees = await db.createCollection("employees");
      }
      collections.employees = employees;
      let work: Collection = await db.collection('employeework');
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
      let missions = await client.db('metrics2').collection("missions");
      if (!missions) {
        missions = await client.db('metrics2').createCollection('missions');
      }
      collections.missions = missions;
      let outages = await client.db('metrics2').collection('outages');
      if (!outages) {
        outages = await client.db('metrics2').createCollection('outages');
      }
      collections.outages = outages;
      console.log('Successfully connected to collections');
    } catch (error) {
      console.log(error);
    }
  }
}