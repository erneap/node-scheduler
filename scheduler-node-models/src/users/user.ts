import { genSaltSync, hashSync, compareSync } from 'bcrypt-ts';

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
  workgroups: string[];
  resettoken?: string;
  resettokenexp?: Date;
  additionalEmails?: string[];
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
    if (user) {
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
   * This function provides a copy of the user object to the web client.  We don't want to
   * pass the password, reset token or expiration date/time.
   * @returns A new User interface for passing
   */
  cloneForOutput(): IUser {
    const output = new User(this);
    output.password = undefined;
    output.resettoken = undefined;
    output.resettokenexp = undefined;
    return output;
  }

  /**
   * This function will reset the password, bad attemtps and expiration date.  The new 
   * password will be excrypted for storage.
   * @param passwd The string value for the new password
   */
  setPassword(passwd: string): void {
    const salt = genSaltSync(12);
    const result = hashSync(passwd, salt);
    this.password = result;
    this.passwordExpires = new Date();
    this.badAttempts = 0;
  }

  /**
   * This function will be used in authentication to verify if the password provided is
   * equivelent to the stored one.
   * @param pwd The string value to compare against the encrypted password.
   * @throws An error if the account is locked or there is a mismatch with the password.
   */
  checkPassword(pwd: string): void {
      if (this.password && compareSync(pwd, this.password)) {
        if (this.badAttempts > 2) {
          throw new Error("Account Locked")
        }
        this.badAttempts = 0;
        return;
      } else {
        this.badAttempts++;
        throw new Error("Account Mismatch");
      }
    }

    /**
     * This function will provide a random 16 character password.
     * @returns A string value representing the new random password.
     */
    createRandomPassword(): string {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
        + '0123456789';
      const charLength = characters.length;
      for (let i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charLength))
      }
      this.setPassword(result);
      this.badAttempts = -1;
      return result;
    }

    /**
     * This function will unlock the user account to allow for access.
     */
    unlock(): void {
      this.badAttempts = 0;
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
     * This function will create a random string used as a token to reset the user's 
     * password when the user had forgotten it.  It will be emailed to the user's
     * email addresses.  The token will be good for 1 hour, so an expiration date/time
     * is also set.
     * @returns A string value for the reset token.
     */
    createResetToken(): string {
      let result = '';
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
        + '0123456789';
      const charLength = characters.length;
      for (let i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charLength))
      }
      let now = new Date();
      this.resettokenexp = new Date(now.getTime() + 3600000);
      this.resettoken = result;
      return result;
    }

    /**
     * This function will verify the provided string token in comparison to that recorded
     * in the user's record.  The process also checks to ensure the token isn't expired.
     * @param token A string value for the comparison token.
     * @returns A boolean value to indicate if the token matches and not expired.
     */
    checkResetToken(token: string): boolean {
      const now = new Date();
      if (this.resettoken && this.resettokenexp) {
        if (this.resettoken === token 
          && now.getTime() < this.resettokenexp?.getTime()) {
          return true;
        } else {
          if (this.resettokenexp.getTime() < now.getTime()) {
            throw new Error("Reset Token Expired");
          }
          throw new Error("Reset Token Error");
        }
      }
      return false;
    }

  /**
   * This function will add a new email address, if it isn't already in the list
   * @param email The string value for the email to add.
   */
  addAdditionalEmail(email: string) {
    let found = false;
    this.additionalEmails.forEach(em => {
      if (em.toLowerCase() === email.toLowerCase()) {
        found = true;
      }
    });
    if (!found) {
      this.additionalEmails.push(email);
      this.additionalEmails.sort();
    }
  }

  /**
   * This function will remove an email address from the user's additional email
   * address list.
   * @param email The string value for the email to remove.
   */
  deleteAdditionalEmail(email: string) {
    let found = -1;
    this.additionalEmails.forEach((em, e) => {
      if (em.toLowerCase() === email.toLowerCase()) {
        found = e;
      }
    });
    if (found >= 0) {
      this.additionalEmails.splice(found, 1);
    }
  }
}