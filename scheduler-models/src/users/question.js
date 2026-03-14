"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityQuestion = void 0;
/**
 * This class defines a security question object, which implements the
 * security question interface of question and answer.  It also includes
 * function to update the question and answer, plus provides a method
 * of comparing the answer with one provided.
 */
class SecurityQuestion {
    constructor(q) {
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
    compareTo(other) {
        if (other) {
            if (this.id === other.id) {
                return (this.question < other.question) ? -1 : 1;
            }
            return (this.id < other.id) ? -1 : 1;
        }
        return -1;
    }
}
exports.SecurityQuestion = SecurityQuestion;
