import { Request, Response, Router } from "express";
import { DeleteNotices, Logger, NewNotice, Notice } from "scheduler-node-models/general";
import { auth } from '../middleware/authorization.middleware';
import { mdbConnection } from "scheduler-node-models/config";
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/general/process_${(new Date().toDateString())}.log`);

router.get('/notices/:userid', auth, async(req: Request, res: Response) => {
  const notices: Notice[] = [];
  let conn;
  try {
    const userid = req.params.userid as string;
    if (userid && mdbConnection.pool) {
      // get a connection from the db.pool
      conn = await mdbConnection.pool.getConnection();

      // execute a query for notices for the user
      const query = `SELECT * FROM notices WHERE receiver='${userid}' ORDER BY createdon;`;
      const rows = await conn.query<any[]>(query);

      // compile the notice rows into the list of notices
      rows.forEach(row => {
        notices.push(new Notice({
          id: row.id,
          date: new Date(row.createdon),
          to: row.receiver,
          from: row.sender,
          message: row.message
        }));
      });
      notices.sort((a,b) => a.compareTo(b));
    } else {
      throw new Error('No userid provided');
    }

    // respond with the list of notices
    res.status(200).json(notices);
  } catch (err) {
    console.log(err);
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  } finally {
    if (conn) conn.release();
  }
});

router.post('/notice', auth, async(req: Request, res: Response) => {
  let conn;
  try {
    const iNote = req.body as NewNotice;
    if (iNote && iNote.message !== '' && mdbConnection.pool) {
      conn = await mdbConnection.pool.getConnection();

      const noteid = (uuidv4()).toString();
      const now = new Date();

      const sql = "INSERT INTO notices (id, createdon, receiver, sender, message) "
        + "VALUES (?, ?, ?, ?, ?)";
      const values = [ noteid, now, iNote.receiver, iNote.sender, iNote.message ];

      const result = await conn.query(sql, values);

      res.status(201).json({"message": 'Note created'});
    } else {
      throw new Error('Missing Data or connection pool');
    }
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  } finally {
    if (conn) conn.release();
  }
});

/**
 * This api process will be used to catch requests to delete a single notice
 * from the database.
 */
router.delete('/notice/:id', auth, async(req: Request, res: Response) => {
  let conn;
  try {
    const noteid = req.params.id as string;
    if (noteid && mdbConnection.pool) {
      conn = await mdbConnection.pool.getConnection();

      const sql = "DELETE FROM notices WHERE id=? ";
      const values = [ noteid ];

      const results = await conn.query(sql, values);
      res.status(200).json({'message':'Note deleted'});
    } else {
      throw new Error('Missing Data or connection pool');
    }
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  } finally {
    if (conn) conn.release();
  }
});

router.delete('/notices', auth, async(req: Request, res: Response) => {
  let conn;
  try {
    const notelist = req.body as DeleteNotices;
    if (notelist &&  mdbConnection.pool) {
      conn = await mdbConnection.pool.getConnection();

      let sql = "DELETE FROM notices WHERE id IN (";
      if (notelist.notes.length > 0) {
        notelist.notes.forEach((id, i) => {
          if (i > 0) {
            sql += ',';
          }
          sql += `'${id}'`;
        })
        sql += ')';
        const results = await conn.query(sql);
        res.status(200).json({'message':'Notes deleted'});
      } else {
        res.status(200).json({'message': "Nothing to delete"});
      }
    } else {
      throw new Error('Missing Data or connection pool');
    }
  } catch (err) {
    const error = err as Error;
    logger.log(`Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  } finally {
    if (conn) conn.release();
  }
});

export default router;