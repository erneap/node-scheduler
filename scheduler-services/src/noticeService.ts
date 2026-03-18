import { PoolConnection } from "mariadb/*";
import { LogEntry, Notice } from "scheduler-models/general";
import { mdbConnection } from "./sqldb";

export class NoticeService {
  /**
   * This method will retrieve a single notice from the database
   * @param id The string value for the identifier for the notice.
   * @returns The notice object associated with the identifier.
   */
  async getById(id: number): Promise<Notice> {
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        let notice = new Notice();
        conn = await mdbConnection.pool.getConnection();
        const sql = "SELECT * FROM notices WHERE id=?;";
        const noteVals = [ id ];
        const results = await conn.query(sql, noteVals );
        if (results.length > 0) {
          const result = results[0]
          notice = new Notice({
            id: Number(result.id),
            date: new Date(result.createdon),
            to: result.receiver,
            from: result.sender,
            message: result.message
          });
          return notice;
        } else {
          throw new Error('No notice with requested id')
        }
      } else {
        throw new Error('No connection pool')
      }
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * This method will be used to pull any active notices from the database with the 
   * receiver equal to the userid given.
   * @param userid The string value for the receiver of the notices.
   * @returns A list of notice objects for the user.
   */
  async get(userid: string): Promise<Notice[]> {
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        let notices: Notice[] = [];
        conn = await mdbConnection.pool.getConnection();
        const sql = "SELECT * FROM notices WHERE receiver=?;";
        const noteVals = [ userid ];
        const results = await conn.query(sql, noteVals );
        results.forEach((row: any) => {
          notices.push(new Notice({
            id: Number(row.id),
            date: new Date(row.createdon),
            to: row.receiver,
            from: row.sender,
            message: row.message
          }));
        });
        notices.sort((a,b) => a.compareTo(b));
        return notices;
      } else {
        throw new Error('No connection pool')
      }
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * This method will add a new notice to the database.
   * @param sender The string value for the originator's id of the message.
   * @param receiver The string value for the receiver's id for the message;
   * @param msg The string value for the message.
   * @returns The notice object corresponding to the notice.
   */
  async insert(sender: string, receiver: string, msg: string): Promise<Notice> {
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        const notice = new Notice({
          id: 0,
          to: receiver,
          from: sender,
          message: msg
        });
        const now = new Date();
        // add the new notice
        let sql = "INSERT INTO notices (createdon, receiver, sender, message) "
          + "VALUES (?, ?, ?, ?);";
        const insertVals = [ now, receiver, sender, msg ];
        await conn.query(sql, insertVals);
        // get the new notice identifier.
        sql = "SELECT MAX(id) as id from notices;";
        const results = await conn.query(sql);
        if (results.length > 0) {
          const result = results[0];
          notice.id = Number(result.id);
        }
        return notice;
      } else {
        throw new Error('No connection pool')
      }
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * This method will remove/delete a notice from the database.
   * @param id The numeric value for the notice identifier.
   */
  async remove(id: number): Promise<void> {
    let conn: PoolConnection | undefined;
    try {
      if (mdbConnection.pool) {
        conn = await mdbConnection.pool.getConnection();
        
        let sql = "DELETE FROM notices WHERE id=?;";
        const insertVals = [ id ];
        await conn.query(sql, insertVals);
      } else {
        throw new Error('No connection pool')
      }
    } catch (err) {
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }
}