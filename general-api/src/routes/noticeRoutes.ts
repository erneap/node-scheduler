import { Request, Response, Router } from "express";
import { DeleteNotices, NewNotice, Notice } from "scheduler-models/general";
import { auth } from '../middleware/authorization.middleware';
import { v4 as uuidv4 } from 'uuid';
import { Logger, mdbConnection, NoticeService, postLogEntry } from "scheduler-services";
const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/general/process_${(new Date().toDateString())}.log`);

router.get('/notices/:userid', auth, async(req: Request, res: Response) => {
  const notices: Notice[] = [];
  try {
    const userid = req.params.userid as string;
    if (userid && userid !== '') {
      const noticeService = new NoticeService();
      const entries = await noticeService.get(userid);
      entries.forEach(note => {
        notices.push(new Notice(note));
      })
      notices.sort((a,b) => a.compareTo(b));
    } else {
      throw new Error('No userid provided');
    }

    // respond with the list of notices
    res.status(200).json(notices);
  } catch (err) {
    const error = err as Error;
    await postLogEntry('general', `notices: get: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

router.post('/notice', auth, async(req: Request, res: Response) => {
  try {
    const iNote = req.body as NewNotice;
    const noticeService = new NoticeService();
    if (iNote && iNote.message !== '') {
      await noticeService.insert(iNote.sender, iNote.receiver, iNote.message);

      res.status(201).json({"message": 'Note created'});
    } else {
      throw new Error('Missing Data or connection pool');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('general', `notice: Post: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * This api process will be used to catch requests to delete a single notice
 * from the database.
 */
router.delete('/notice/:id', auth, async(req: Request, res: Response) => {
  try {
    const noteid = req.params.id as string;
    const noticeService = new NoticeService();
    if (noteid) {
      const note = Number(noteid);
      await noticeService.remove(note);
      res.status(200).json({'message':'Note deleted'});
    } else {
      throw new Error('Missing Data or connection pool');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('general', `notice: Delete: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  } 
});

router.delete('/notices', auth, async(req: Request, res: Response) => {
  try {
    const notelist = req.body as DeleteNotices;
    if (notelist) {
      const noticeService = new NoticeService();
      notelist.notes.forEach(async (sNoteId) => {
        const id = Number(sNoteId);
        await noticeService.remove(id);
      })
    } else {
      throw new Error('Missing Data or connection pool');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('general', `notices: Delete: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

export default router;