import { MongoClient, Db, Collection } from 'mongodb';
import dotenv from 'dotenv';

export const collections: { 
  users?: Collection,
  employees?: Collection,
} = {}

export async function connectToDB() {
  while (!process.env.MONGO_USER) {
    await dotenv.config()
  }
  const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@`
    + `${process.env.MONGO_SERVER}:${process.env.MONGO_PORT}?`
    + `${process.env.MONGO_APPEND}`;
  if (uri) {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      console.log('Connected to database');
      const authDB: Db = client.db('authenticate')
      let users: Collection = authDB.collection("users");
      if (!users) {
        users = await authDB.createCollection("users");
      }
      collections.users = users;
      const schDB: Db = client.db('scheduler');
      let employees = schDB.collection("employees")
      if (!employees) {
        employees = await schDB.createCollection("employees");
      }
      collections.employees = employees;
      console.log('Successfully connected to collections');
    } catch (error) {
      console.log(error);
    }
  }
}