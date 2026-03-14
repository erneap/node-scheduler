/**
 * This interface defines the data members for communications data.
 */
export interface ICommunication {
  id: string;
  explanation: string;
  exploitations: string[]
  sortID: number;
}

/**
 * This class defines the data members plus actions for a communication object.
 */
export class Communication implements ICommunication {
  public id: string;
  public explanation: string;
  public exploitations: string[];
  public sortID: number;

  constructor(comm?: ICommunication) {
    this.id = (comm) ? comm.id : '';
    this.explanation = (comm) ? comm.explanation : '';
    this.exploitations = [];
    if (comm) {
      comm.exploitations.forEach(exp => {
        this.exploitations.push(exp);
      });
      this.exploitations.sort();
    }
    this.sortID = (comm) ? comm.sortID : 0;
  }

  compareTo(other?: Communication): number {
    if (other) {
      return (this.sortID < other.sortID) ? -1 : 1;
    }
    return -1;
  }

  hasExploitation(exp: string): boolean {
    let answer = false;
    this.exploitations.forEach(exploit => {
      if (exploit.toLowerCase() === exp.toLowerCase()) {
        answer = true;
      }
    })
    return answer;
  }
}