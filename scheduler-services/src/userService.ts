import { IUser, User } from "scheduler-models/users";
import { collections } from "./mongoconnect";
import { ObjectId } from "mongodb";

/**
 * This class definition will be used to get, insert, replace and/or delete users from
 * the mongo database, users collection.
 */
export class UserService {
  /**
   * This method will be used to retrieve or get a user from the database.
   * @param userid The string value for the user's identifier.
   * @returns A user object for the user identifier given.
   */
  async get(userid: string): Promise<User> {
    let user = new User();
    if (userid === '') {
      throw new Error('No user id given');
    }
    if (collections.users) {
      const query = { _id: new ObjectId(userid)};
      const iUser = await collections.users.findOne<IUser>(query);
      if (iUser) {
        user = new User(iUser);
      } else {
        throw new Error('User not found');
      }
    } else {
      throw new Error('No user collection');
    }
    return user;
  }

  /**
   * This method will be used to retrieve or get a user from the database by email address.
   * @param email The string value for the user's email address.
   * @returns A user object for the user identifier given.
   */
  async getByEmail(email: string): Promise<User> {
    let user = new User();
    if (email === '') {
      throw new Error('No user email address given');
    }
    if (collections.users) {
      const query = { emailAddress: email};
      const iUser = await collections.users.findOne<IUser>(query);
      if (iUser) {
        user = new User(iUser);
      } else {
        throw new Error('User not found');
      }
    } else {
      throw new Error('No user collection');
    }
    return user;
  }

  /**
   * This method will be used to insert a new user into the user's collection, but it also
   * checks for the user already in the database by comparing the new user's email address
   * or name (first, middle, last) to those already in the collection.
   * @param newuser The user interface with all the required new user data, including 
   * password.
   * @returns The user object associated with the user in the collection.
   */
  async insert(newuser: IUser): Promise<User> {
    let user = new User(newuser);
    if (collections.users) {
      // first look for the user by email and name (first and last)
      let found = false;
      const usercursor = collections.users.find<IUser>({});
      const userArray = await usercursor.toArray();
      userArray.forEach(usr => {
        if (usr.emailAddress.toLowerCase() === newuser.emailAddress.toLowerCase() 
          || (usr.lastName.toLowerCase() === newuser.lastName.toLowerCase()
          && usr.firstName.toLowerCase() === newuser.firstName.toLowerCase()
          && usr.middleName.toLowerCase() === newuser.middleName.toLowerCase())) {
          user = new User(usr);
          found = true;
        }
      });
      // if not present, add it to the database along with the new user identifier.
      if (!found) {
        const result = await collections.users.insertOne(user);
        user.id = result.insertedId.toString();
      }
    } else {
      throw new Error('No user collection');
    }
    return user;
  }

  /**
   * This method is used to update/replace a user in the user's collection.  It replaces
   * based on the user's identifier.
   * @param replace The user interface with all the required user information.
   */
  async replace(replace: IUser): Promise<void> {
    let user = new User(replace);
    if (collections.users) {
      const query = { _id: new ObjectId(replace.id)};
      const result = await collections.users.replaceOne(query, user);
      if (result.modifiedCount === 0 && result.upsertedCount === 0) {
        throw new Error('User not replaced');
      }
    } else {
      throw new Error('No user collection');
    }
  }

  /**
   * This method will remove a user from the user collection.
   * @param userid The string value for the user to remove.
   */
  async remove(userid: string): Promise<void> {
    if (collections.users) {
      if (userid !== '') {
        const query = { _id: new ObjectId(userid)};
        const result = await collections.users.deleteOne(query);
        if (result.deletedCount <= 0) {
          throw new Error('No users deleted');
        }
      } else {
        throw new Error('No user identifier given');
      }
    } else {
      throw new Error('No user collection');
    }
  }

  /**
   * This method will be used to retrieve all users from the user collection.
   * @returns A array of user objects.
   */
  async getAll(): Promise<User[]> {
    if (collections.users) {
      const users: User[] = [];
      const userCursor = collections.users.find<IUser>({});
      const userArray = await userCursor.toArray();
      userArray.forEach(iUser => {
        users.push(new User(iUser));
      });
      users.sort((a,b) => a.compareTo(b));
      return users;
    } else {
      throw new Error('No user collection');
    }
  }
}