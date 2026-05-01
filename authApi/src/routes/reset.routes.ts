import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { compareSync, genSaltSync, hashSync } from 'bcrypt-ts';
import { ForgotPasswordRequest, ISecurityQuestion, PasswordResetRequest, 
  SecurityQuestion, SecurityQuestionResponse, User } from 'scheduler-models/users';
import { collections, mdbConnection, postLogEntry, sendMail, UserService } from 'scheduler-services';

const router = express.Router();

/**
 * This route will be used to get the full list of security questions that can be used
 * in the alternate reset method for authentication, prior to password reset.
 */
router.get('/questions', async (req: Request, res: Response) => {
  let conn;
  try {
    if (mdbConnection.pool) {
      // get a connection from the db.pool
      conn = await mdbConnection.pool.getConnection();
      const sql = "SELECT * FROM questions ORDER BY id";
      const answers = await conn.query<ISecurityQuestion[]>(sql);
      res.status(200).json(answers);
    }
  } catch (error) {
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = error as string;
    }
    postLogEntry('authentication', `questions: Get: Error: ${message}`);
    res.status(400).json({message: message });
  } finally {
    if (conn) conn.release();
  }
})

/**
 * This route will be used for a password reset request where the user can't remember
 * his/her password.  It will receive the user's email address, check to see if a user
 * account is present, create a reset token and expiration date/time, then send an email
 * to the email address and any additional email addresses with the reset token included.
 */
router.post('/reset', async(req: Request, res: Response) => {
  const now = new Date();
  try {
    const uService = new UserService();
    const request = req.body as ForgotPasswordRequest;
    const email = request.emailAddress;

    const user = await uService.getByEmail(email);
    const result = user.createResetToken();
    await uService.replace(user);

    let message = '<!DOCTYPE html>\n<html>\n<head>\n<style>\n'
      + 'body { background-color:lightblue;display:flex;flex-direction:column;'
      + 'justify-content:center;align-items:center;padding:10px;}\n'
      + 'div.main {display:flex;flex-direction:column;justify-content:center;'
      + 'align-items: center;}\n'
      + 'div.password {background-color:blue;color:white;display:flex;'
      + 'flex-direction:column;justify-content:center;align-items:center;'
      + 'padding: 10px;}\n'
      + '</style>\n</head>\n<body>\n'
      + '<h1>Team Scheduler Web Application</h1>\n'
      + '<h2>Forgot Your Password</h2>\n'
      + '<div class="main">\n<p>\n'
      + "You have notified the site that you've forgotten your password.  The "
      + "process for re-establishing log in privileges is in effect.  Please "
      + "copy the token string below and click the link to get you back to a "
      + "web page to change your forgotten password.\n</p>\n"
      + "<p>We are glad that you've choosen to enrich your life!</p>\n"
      + '<div class="password">\n'
      + '<p>The following is your token string to verify you are the account '
      + `holder:</p>\n<h2 style="color: yellow;">${result}</h2>\n`
      + '<p style="color:lightpink;text-decoration: underline;">\n'
      + '<a href="http://www.osanscheduler.com/forgot">Link back to site</a>\n'
      + '</p>\n</div>\n<div style="margin-top: 25px;">'
      + 'Thanks again, the webmaster.</div>\n</div>\n</body>\n</html>';

    try {
      let to = user.emailAddress;
      user.additionalEmails.forEach(email => {
        if (user.emailAddress.toLowerCase() !== email.toLowerCase()) {
          to += `, ${email}`;
        }
      });
    
      await sendMail(to, 'Forgot Password Token', message);
    } catch (error) {
      throw error;
    }
    return res.status(200).json(user);
  } catch (error) {
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = error as string;
    }
    postLogEntry('authentication', `reset: Post: Error: ${message}`);
    res.status(400).json({message: message });
  }
});

/**
 * This route will be used for a password reset request where the user can't remember
 * his/her password.  It will receive the user's email address, check to see if a user
 * account is present, create a reset token and expiration date/time, then send an email
 * to the email address and any additional email addresses with the reset token included.
 */
router.post('/resetadmin', async(req: Request, res: Response) => {
  const now = new Date();
  try {
    const uService = new UserService();
    const request = req.body as ForgotPasswordRequest;
    const id = request.emailAddress;

    const user = await uService.get(id);
    const result = user.createResetToken();
    const salt = genSaltSync(12)
    const hash = hashSync(result, salt);
    user.password = hash;
    user.passwordExpires = new Date();
    user.badAttempts = -1;
    await uService.replace(user);

    let message = '<!DOCTYPE html>\n<html>\n<head>\n<style>\n'
      + 'body { background-color:lightblue;display:flex;flex-direction:column;'
      + 'justify-content:center;align-items:center;padding:10px;}\n'
      + 'div.main {display:flex;flex-direction:column;justify-content:center;'
      + 'align-items: center;}\n'
      + 'div.password {background-color:blue;color:white;display:flex;'
      + 'flex-direction:column;justify-content:center;align-items:center;'
      + 'padding: 10px;}\n'
      + '</style>\n</head>\n<body>\n'
      + '<h1>Team Scheduler Web Application</h1>\n'
      + '<h2>Temporary Password</h2>\n'
      + '<div class="main">\n<p>\n'
      + "The administrator has reset your password to a random password, given below."
      + "  You will use this password to log into your account with the email address "
      + "used to send this.  You will be required to change your password immediately."
      + "\n</p>\n"
      + "<p>We are glad that you've choosen to enrich your life!</p>\n"
      + '<div class="password">\n'
      + '<p>The following is your TEMPORARY PASSWORD:'
      + `</p>\n<h2 style="color: yellow;">${result}</h2>\n`
      + '<p style="color:lightpink;text-decoration: underline;">\n'
      + '<a href="http://www.osanscheduler.com/forgot">Link back to site</a>\n'
      + '</p>\n</div>\n<div style="margin-top: 25px;">'
      + 'Thanks again, the webmaster.</div>\n</div>\n</body>\n</html>';

    try {
      let to = user.emailAddress;
      user.additionalEmails.forEach(email => {
        if (user.emailAddress.toLowerCase() !== email.toLowerCase()) {
          to += `, ${email}`;
        }
      });
    
      await sendMail(to, 'Password Token', message);
    } catch (error) {
      throw error;
    }
    return res.status(200).json(user);
  } catch (error) {
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = error as string;
    }
    postLogEntry('authentication', `reset: Post: Error: ${message}`);
    res.status(400).json({message: message });
  }
});

/**
 * This route will be used as an alternative password reset request where the 
 * user can't remember his/her password.  It will receive the user's email 
 * address, check to see if a user account is present, randomly select a 
 * security question and pass it to the user interface for securing answer.
 */
router.post('/altreset', async(req: Request, res: Response) => {
  const now = new Date();
  try {
    const uService = new UserService();
    const request = req.body as ForgotPasswordRequest;
    const email = request.emailAddress;

    const user = await uService.getByEmail(email);

    let question: SecurityQuestionResponse = {
      emailAddress: user.emailAddress,
      questionid: 0,
      question: ''
    };
    let randQuest = Math.floor(Math.random() * 3) + 1;
    user.questions.sort((a,b) => a.compareTo(b));
    user.questions.forEach(quest => {
      if (quest.id <= randQuest && quest.question !== '') {
        const q = new SecurityQuestion(quest);
        question.questionid = q.id;
        question.question = q.question;
      }
    });
    if (question.questionid > 0) {
      res.status(201).json(question);
    } else {
      throw new Error("No Question available");
    }
  } catch (error) {
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = error as string;
    }
    postLogEntry('authentication', `reset: altreset: Post: Error: ${message}`);
    res.status(400).json({message: message });
  }
});

/**
 * This route will complete the password reset process, by receiving the password reset
 * request of email address, new password, and the reset token.  The process will pull 
 * the user from the database, from the email address, then compare the reset token and 
 * time versus reset token expiration date/time, then if both pass, reset the user's 
 * password. 
 */
router.put('/reset', async(req: Request, res: Response) => {
  try {
    const userService = new UserService();
    const now = new Date();
    const request = req.body as PasswordResetRequest;
    if (request.emailAddress !== '') {
      const user = await userService.getByEmail(request.emailAddress);
      if (user.resettoken && user.resettokenexp 
        && user.resettoken === request.resettoken 
        && user.resettokenexp.getTime() > now.getTime()) {
        const salt = genSaltSync(12)
        const hash = hashSync(request.password, salt);
        user.password = hash;
        user.passwordExpires = new Date();
        user.badAttempts = 0;
        await userService.replace(user);
        return res.status(200).json(user);
      } else {
        throw new Error('Reset token mismatch');
      }
    } else {
      throw new Error('User email address not given');
    }
  } catch (error) {
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = error as string;
    }
    postLogEntry('authentication', `reset: Put: Error: ${message}`);
    res.status(404).json({message: message });
  }
});

/**
 * This route will complete the password reset process by security question, by receiving 
 * the password reset request of email address, new password, and the reset token.  The process will pull 
 * the user from the database, from the email address, then compare the reset token and 
 * time versus reset token expiration date/time, then if both pass, reset the user's 
 * password. 
 */
router.put('/altreset', async(req: Request, res: Response) => {
  try {
    const userService = new UserService();
    const now = new Date();
    const request = req.body as PasswordResetRequest;
    if (request.emailAddress !== '') {
      const user = await userService.getByEmail(request.emailAddress);
      if (request.subid) {
        let found = false;
        user.questions.forEach(quest => {
          if (quest.id === request.subid) {
            if (compareSync(request.resettoken.toLowerCase(), quest.answer)) {
              found = true;
            }
          }
        });
        if (found) {
          const salt = genSaltSync(12)
          const hash = hashSync(request.password, salt);
          user.password = hash;
          user.passwordExpires = new Date();
          user.badAttempts = 0;
          await userService.replace(user);
          return res.status(200).json(user);
        } else {
          throw new Error('Question-answer mismatch');
        }
      } else {
        throw new Error('Question answer no identifier');
      }
    } else {
      throw new Error('User email address not given');
    }
  } catch (error) {
    let message = '';
    if (typeof error === 'string') {
      message = error;
    } else if (error instanceof Error) {
      message = error.message;
    } else {
      message = error as string;
    }
    postLogEntry('authentication', `reset: Put: Error: ${message}`);
    res.status(404).json({message: message });
  }
});

export default router;