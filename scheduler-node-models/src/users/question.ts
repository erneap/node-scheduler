/**
 * This interface provides the framework for the security question.  
 * Namely, a security question and its encrypted answer.
 */
export interface ISecurityQuestion {
  id: number;
  question: string;
  answer?: string;
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
    this.answer = (q && q.answer) ? q.answer : '';
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
}