import { ISecurityQuestion, SecurityQuestion } from './question';
import { IPermission, Permission } from './permission';

/**
 * The user class and interface.
 */

/**
 * This interface ensures all the required fields are present to represent the user and
 * its class object.
 */
export interface IUser {
  _id?: string;
  id: string;
  emailAddress: string;
  password?: string;
  passwordExpires: Date;
  badAttempts: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  workgroups?: string[];
  resettoken?: string;
  resettokenexp?: Date;
  additionalEmails?: string[];
  questions?: ISecurityQuestion[];
  permissions?: IPermission[];
}

/**
 * This class represents a user and all the actions available to the user object.
 * The main class members are: 
 * id (primary key), 
 * email address (used in authentication and email messages for reset), 
 * password (authentication), password expires (old use -
 * to determine the when the password would expire, but new use is to track when 
 * created to allow for the warning to change after 90 days and requiring after 1 year),
 * badAttempts (count of number of mismatch of password since last known good 
 * authentication),
 * first, middle and last names (name - middle is optional),
 * workgroups (string array to provide identificationn of permission within an 
 * application),
 * resetToken and resettokenexp (a storage location or a reset token used in forgot
 * password change, plus token expiration date/time the reset token expires)
 */
export class User implements IUser {
  public id: string;
  public emailAddress: string;
  public password?: string;
  public passwordExpires: Date;
  public badAttempts: number;
  public firstName: string;
  public middleName?: string;
  public lastName: string;
  public workgroups: string[];
  public resettoken?: string;
  public resettokenexp?: Date;
  public additionalEmails: string[];
  public questions: SecurityQuestion[];
  public permissions: Permission[];

  constructor(user?: IUser) {
    this.id = (user && user.id ) ? user.id : '';
    if (this.id === '') {
      this.id = (user && user._id) ? user._id.toString() : '';
    }
    this.emailAddress = (user) ? user.emailAddress : '';
    this.password = (user) ? user.password : undefined;
    this.passwordExpires = (user) ? new Date(user.passwordExpires) : new Date();
    this.badAttempts = (user) ? user.badAttempts : 0;
    this.firstName = (user) ? user.firstName : '';
    this.middleName = (user) ? user.middleName : undefined;
    this.lastName = (user) ? user.lastName : '';
    this.workgroups = [];
    if (user && user.workgroups) {
      user.workgroups.forEach(wg => {
        this.workgroups.push(wg);
      });
      user.workgroups.sort((a,b) => (a < b) ? -1 : 1);
    }
    this.resettoken = (user && user.resettoken) ? user.resettoken : undefined;
    this.resettokenexp = (user && user.resettokenexp) 
      ? new Date(user.resettokenexp) : undefined;
    this.additionalEmails = [];
    if (user && user.additionalEmails) {
      user.additionalEmails.forEach(em => {
        this.additionalEmails?.push(em);
      });
      this.additionalEmails.sort();
    }
    this.questions = [];
    if (user && user.questions) {
      user.questions.forEach(quest => {
        this.questions.push(new SecurityQuestion(quest));
      });
      this.questions.sort((a,b) => a.compareTo(b));
    } else {
      for (let i=1; i < 4; i++ ) {
        this.questions.push(new SecurityQuestion({
          id: i, question: '', answer: ''
        }))
      }
    }
    this.permissions = [];
    if (user && user.permissions) {
      user.permissions.forEach(perm => {
        this.permissions.push(new Permission({
          application: perm.application,
          job: perm.job
        }));
      });
    }
    if (this.permissions.length === 0 && this.workgroups.length > 0) {
      this.workgroups.forEach(wg => {
        const parts = wg.split('-')
      })
    }
  }

  /**
   * This function is used to sort this class' objects into an ordered list.  The order
   * is determined by last, first and middle names
   * @param other Another user object used during comparison
   * @returns a numeric value to show the object is before or after the other object. 
   * -1 is for before and 1 is for after.
   */
  compareTo(other?: User): number {
    if (other) {
      if (other.lastName === this.lastName) {
        if (other.firstName === this.firstName) {
          if (this.middleName && other.middleName) {
            return (this.middleName < other.middleName) ? -1 : 1;
          } else if (!this.middleName) {
            return -1;
          } else {
            return 1;
          }
        }
        return (this.firstName < other.firstName) ? -1 : 1;
      }
      return (this.lastName < other.lastName) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function will provide the user's name in the form first middle and last.
   * @returns A string value for the user's name.
   */
  getFullName(): string {
    if (!this.middleName) {
      return this.firstName + ' ' + this.lastName;
    }
    return this.firstName + ' ' + this.middleName.substring(0,1) + '. '
      + this.lastName;
  }

  /**
   * This function will provide the user's name in the form first last.
   * @returns A string value for the user's name.
   */
  getFirstLast(): string {
    return this.firstName + ' ' + this.lastName;
  }

  /**
   * This function will provide the user's name in the form last, first.
   * @returns A string value for the user's name.
   */
  getLastFirst(): string {
    return this.lastName + ', ' + this.firstName;
  }

  /**
   * This function will be used to look to ensure the user has a particular job/permission
   * for an application.  All checks are done with lower case strings.
   * @param application The string value for the application
   * @param job The string value the job and/or permission to check against.
   * @returns The boolean value for the user having that permission group.
   */
  hasPermission(application: string, job: string): boolean {
    let answer = false;
    this.permissions.forEach(perm => {
      if (perm.application.toLowerCase() === application.toLowerCase()
        && perm.job.toLowerCase() === job.toLowerCase()) {
        answer = true;
      }
    });
    return answer;
  }
}