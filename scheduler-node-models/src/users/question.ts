import { genSaltSync, hashSync, compareSync } from 'bcrypt-ts';

/**
 * This interface provides the framework for the security question.  
 * Namely, a security question and its encrypted answer.
 */
export interface ISecurityQuestion {
  id: number;
  question: string;
  answer: string;
}

/**
 * This class defines a security question object, which implements the
 * security question interface of question and answer.  It also includes
 * function to update the question and answer, plus provides a method
 * of comparing the answer with one provided.
 */
export class SecurityQuestion implements ISecurityQuestion {
  public id: number;
  public question: string;
  public answer: string;

  constructor(q?: ISecurityQuestion) {
    this.id = (q) ? q.id : 0;
    this.question = (q) ? q.question : '';
    this.answer = (q) ? q.answer : '';
  }

  /**
   * This function is used in sorting the security questions, by 
   * first comparing their identified, then the question.
   * @param other (optional) the other security question to be compared to
   * @returns A numeric value for whether the question is before (-1) 
   *    or after (1)
   */
  compareTo(other?: SecurityQuestion): number {
    if (other) {
        if (this.id === other.id) {
            return (this.question < other.question) ? -1 : 1;
        }
        return (this.id < other.id) ? -1 : 1;
    }
    return -1;
  }

  /**
   * This function is used to update either the question or answer which
   * is provided in the value.  If the field is answer, the value is 
   * saved encrypted of its lower case equivalent.
   * @param field A string value to indicate which object field is to be updated
   * @param value A string value for the update.
   */
  update(field: string, value: string): void {
    switch (field.toLowerCase()) {
      case "question":
        this.question = value;
        break;
      case "answer":
        const salt = genSaltSync(12);
        const result = hashSync(value.toLowerCase(), salt);
        this.answer = result;
        break;
    }
  }

  /**
   * This function will check a provided answer, during reset, with the
   * answer in this object.  It will submit a lower case value for checking
   * because the answer is orginally the lower case value of the provided
   * answer.
   * @param value A string value used during comparision.
   * @returns A boolean value for whether or not the given value is equal to
   * the saved value.
   */
  compare(value: string): boolean {
    return compareSync(value.toLowerCase(), this.answer)
  }
}