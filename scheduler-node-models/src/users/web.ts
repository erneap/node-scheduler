import { IUser } from ".";

/**
 * This interface will be used to authenticate with the application through the api
 * server.
 */
export interface AuthenticationRequest {
  emailAddress: string;
  password: string;
  application?: string;
}

/**
 * This interface will be used between the client and the api server to request a new
 * user.  All fields are required.
 */
export interface AddUserRequest {
  emailAddress: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  password: string;
  application: string;
  permissions?: string[];
}

/**
 * This interface will be used to update a user with a call from the client to the 
 * api server.  All fields would be required.
 */
export interface UpdateUserRequest {
  id: string;
  field: string;
  value: string;
  subid?: number;
}

/**
 * This interface is used in the first part of the forgot password process where the
 * requestor passes his/her email address used as the user identifier for the account.
 */
export interface ForgotPasswordRequest {
  emailAddress: string;
}

/**
 * This interface is used in the second part of the forgot password process, to provide
 * the user's account email address, password and the passed reset token sent via email 
 * to the user's accounts.
 */
export interface PasswordResetRequest {
  emailAddress: string;
  password: string;
  resettoken: string;
  subid?: number;
}

/**
 * This interface is used in the security question reset part 1 to provide the user's
 * security question to be answered.
 */
export interface SecurityQuestionResponse {
  emailAddress: string;
  questionid: number;
  question: string;
}