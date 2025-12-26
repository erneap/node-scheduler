import { Request, Response, Router } from "express";
import { Logger, sendMail } from "scheduler-node-models/general";
import { ForgotPasswordRequest, IUser, PasswordResetRequest, SecurityQuestionResponse, User } from "scheduler-node-models/users";
import { collections } from "../config/mongoconnect";
import { ObjectId } from "mongodb";
import { SecurityQuestion } from "scheduler-node-models/users/question";

const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/authenticate/process_${(new Date().toDateString())}.log`);

/**
 * This route will be used for a password reset request where the user can't remember
 * his/her password.  It will receive the user's email address, check to see if a user
 * account is present, create a reset token and expiration date/time, then send an email
 * to the email address and any additional email addresses with the reset token included.
 */
router.post('/reset', async(req: Request, res: Response) => {
  const now = new Date();
  try {
    const request = req.body as ForgotPasswordRequest;
    const email = request.emailAddress;

    const query = { emailAddress: email };
    const iUser = await collections.users?.findOne<IUser>(query);
    if (iUser) {
      const user = new User(iUser)
      const result = user.createResetToken();
      const nquery = { _id: new ObjectId(user.id)};
      await collections.users?.replaceOne(nquery, user);

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
        + "<p>We are glad that you've choosen to enrich your life through faith!</p>\n"
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
    } else {
      throw new Error("User Not Found");
    }
  } catch (error) {
    if (typeof error === 'string') {
      logger.log(`${now.toISOString()} - ${error}`);
      return res.status(401).send(error);
    } else if (error instanceof Error) {
      logger.log(`${now.toISOString()} - ${error.message}`);
      return res.status(401).send(error.message);
    } else {
      logger.log(`${now.toISOString()} - ${error}`);
      return res.status(500).send(error);
    }
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
    const request = req.body as ForgotPasswordRequest;
    const email = request.emailAddress;

    const query = { emailAddress: email };
    const iUser = await collections.users?.findOne<IUser>(query);
    if (iUser) {
      const user = new User(iUser);
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
    } else {
      throw new Error("User Not Found");
    }
  } catch (error) {
    if (typeof error === 'string') {
      logger.log(`${now.toISOString()} - ${error}`);
      return res.status(401).send(error);
    } else if (error instanceof Error) {
      logger.log(`${now.toISOString()} - ${error.message}`);
      return res.status(401).send(error.message);
    } else {
      logger.log(`${now.toISOString()} - ${error}`);
      return res.status(500).send(error);
    }
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
  const now = new Date();
  const colUser = collections.users;
  if (colUser) {
    const request = req.body as PasswordResetRequest;
    if (request.emailAddress !== '') {
      const query = { emailAddress: request.emailAddress };
      const iUser = await colUser.findOne<IUser>(query);
      if (iUser) {
        if (iUser.resettoken && iUser.resettokenexp 
          && iUser.resettoken === request.resettoken 
          && iUser.resettokenexp.getTime() > now.getTime()) {
          const user = new User(iUser);
          user.setPassword(request.password);
          await colUser.replaceOne(query, user);
          return res.status(200).json(user);
        } else {
          logger.log(`${now.toISOString()} - Reset token mismatch (${iUser.emailAddress})`)
          return res.status(400).json({'message': 'Reset token mismatch'});
        }
      } else {
        logger.log(`${now.toISOString()} - User not found (${request.emailAddress})`);
        return res.status(404).json({'message': `User not found (${request.emailAddress})`});
      }
    } else {
      logger.log(`${now.toISOString()} - Users email address not given`);
      return res.status(404).json({'message': 'User email address not given'});
    }
  } else {
    logger.log(`${now.toISOString()} - No user/employee collections`);
    return res.status(404).json({'message': 'Unable to find collection'});
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
  const now = new Date();
  const colUser = collections.users;
  if (colUser) {
    const request = req.body as PasswordResetRequest;
    if (request.emailAddress !== '') {
      const query = { emailAddress: request.emailAddress };
      const iUser = await colUser.findOne<IUser>(query);
      if (iUser) {
        const user = new User(iUser);
        if (request.subid) {
          if (user.checkSecurityQuestion(request.subid, request.resettoken)) {
            user.setPassword(request.password);
            await colUser.replaceOne(query, user);
            return res.status(200).json(user);
          } else {
            return res.status(404).json({'message':'Question answer mismatch'});
          }
        } else {
          return res.status(404).json({'message':'Question answer no identifier'});
        }
      } else {
        logger.log(`${now.toISOString()} - User not found (${request.emailAddress})`);
        return res.status(404).json({'message': `User not found (${request.emailAddress})`});
      }
    } else {
      logger.log(`${now.toISOString()} - Users email address not given`);
      return res.status(404).json({'message': 'User email address not given'});
    }
  } else {
    logger.log(`${now.toISOString()} - No user/employee collections`);
    return res.status(404).json({'message': 'Unable to find collection'});
  }
});

export default router;