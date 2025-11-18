import { MongoClient, Db, Collection } from 'mongodb';

export const collections: { 
  users?: Collection,
  employees?: Collection,
} = {}

export async function connectToDB() {
  const uri = process.env.MONGO_URI;
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