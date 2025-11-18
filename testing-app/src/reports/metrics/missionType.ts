import { Mission } from "scheduler-node-models/metrics";
import { GroundSystem } from "scheduler-node-models/metrics/systemdata";

export class MissionType {
  public exploitation: string;
  public platform: string;
  public missions: Mission[];

  constructor(exp: string, platform: string) {
    this.exploitation = exp;
    this.platform = platform;
    this.missions = [];
  }

  addMission(msn: Mission) {
    this.missions.push(new Mission(msn));
    this.missions.sort((a,b) => a.compareTo(b));
  }

  getScheduled(exploit: string, sensors: string[]): number {
    let answer = 0;
    if ((exploit.toLowerCase() === 'primary' 
      && this.exploitation.toLowerCase() === 'primary')
      || (exploit.toLowerCase() !== 'primary'
      && this.exploitation.toLowerCase() !== 'primary')) {
      if (sensors.length === 0) {
        answer = this.missions.length;
      } else {
        this.missions.forEach(msn => {
          let found = false;
          msn.sensors.forEach(msnSen => {
            sensors.forEach(sensor => {
              if (msnSen.sensorID.toLowerCase() === sensor.toLowerCase()) {
                if (!found) {
                  answer++;
                  found = true;
                }
              }
            });
          })
        });
      }
    }
    return answer;
  }

  getExecuted(exploit: string, sensors: string[]): number {
    let answer = 0;
    if ((exploit.toLowerCase() === 'primary' 
      && this.exploitation.toLowerCase() === 'primary')
      || (exploit.toLowerCase() !== 'primary'
      && this.exploitation.toLowerCase() !== 'primary')) {
      if (sensors.length === 0) {
        this.missions.forEach(msn => {
          if (!msn.aborted && !msn.cancelled && !msn.indefDelay) {
            answer++;
          }
        });
      } else {
        this.missions.forEach(msn => {
          let found = false;
          if (!msn.aborted && !msn.cancelled && !msn.indefDelay) {
            msn.sensors.forEach(msnSen => {
              sensors.forEach(sensor => {
                if (msnSen.sensorID.toLowerCase() === sensor.toLowerCase()) {
                  if (!found) {
                    answer++;
                    found = true;
                  }
                }
              });
            });
          }
        });
      }
    }
    return answer;
  }

  getCancelled(exploit: string, sensors: string[]): number {
    let answer = 0;
    if ((exploit.toLowerCase() === 'primary' 
      && this.exploitation.toLowerCase() === 'primary')
      || (exploit.toLowerCase() !== 'primary'
      && this.exploitation.toLowerCase() !== 'primary')) {
      if (sensors.length === 0) {
        this.missions.forEach(msn => {
          if (msn.cancelled || msn.indefDelay) {
            answer++;
          }
        });
      } else {
        this.missions.forEach(msn => {
          let found = false;
          if (msn.cancelled || msn.indefDelay) {
            msn.sensors.forEach(msnSen => {
              sensors.forEach(sensor => {
                if (msnSen.sensorID.toLowerCase() === sensor.toLowerCase()) {
                  if (!found) {
                    answer++;
                    found = true;
                  }
                }
              });
            });
          }
        });
      }
    }
    return answer;
  }

  getAborted(exploit: string, sensors: string[]): number {
    let answer = 0;
    if ((exploit.toLowerCase() === 'primary' 
      && this.exploitation.toLowerCase() === 'primary')
      || (exploit.toLowerCase() !== 'primary'
      && this.exploitation.toLowerCase() !== 'primary')) {
      if (sensors.length === 0) {
        this.missions.forEach(msn => {
          if (msn.aborted) {
            answer++;
          }
        });
      } else {
        this.missions.forEach(msn => {
          let found = false;
          if (msn.aborted) {
            msn.sensors.forEach(msnSen => {
              sensors.forEach(sensor => {
                if (msnSen.sensorID.toLowerCase() === sensor.toLowerCase()) {
                  if (!found) {
                    answer++;
                    found = true;
                  }
                }
              });
            });
          }
        });
      }
    }
    return answer;
  }

  getPremissionTime(sensors: string[], enclave: string, gs?: GroundSystem): number {
    let answer = 0;
    this.missions.forEach(msn => {
      let senMax = 0;
      if (gs && gs.checkForUse) {
        if (msn.equipmentInUse(gs.id)) {
          msn.sensors.forEach(mSen => {
            if (gs.useSensor(msn.platformID, mSen.sensorID, msn.exploitation, 
              msn.communications, enclave)) {
              if (senMax < mSen.preflightMinutes) {
                senMax = mSen.preflightMinutes;
              }
            }
          });
        }
      } else if (gs && gs.exploitations.length > 0) {
        msn.sensors.forEach(mSen => {
          if (gs.useSensor(msn.platformID, mSen.sensorID, msn.exploitation, 
            msn.communications, enclave)) {
            if (senMax < mSen.preflightMinutes) {
              senMax = mSen.preflightMinutes;
            }
          }
        });      
      } else {
        msn.sensors.forEach(mSen => {
          sensors.forEach(sen => {
            if (sen.toLowerCase() === mSen.sensorID.toLowerCase() 
              && senMax < mSen.preflightMinutes) {
              senMax = mSen.preflightMinutes;
            }
          });
        });
      }
      answer += senMax;
    });
    return answer;
  }

  getPostmissionTime(sensors: string[], enclave: string, gs?: GroundSystem): number {
    let answer = 0;
    this.missions.forEach(msn => {
      let senMax = 0;
      if (gs && gs.checkForUse) {
        if (msn.equipmentInUse(gs.id)) {
          msn.sensors.forEach(mSen => {
            if (gs.useSensor(msn.platformID, mSen.sensorID, msn.exploitation, 
              msn.communications, enclave)) {
              if (senMax < mSen.postflightMinutes) {
                senMax = mSen.postflightMinutes;
              }
            }
          });
        }
      } else if (gs && gs.exploitations.length > 0) {
        msn.sensors.forEach(mSen => {
          if (gs.useSensor(msn.platformID, mSen.sensorID, msn.exploitation, 
            msn.communications, enclave)) {
            if (senMax < mSen.postflightMinutes) {
              senMax = mSen.postflightMinutes;
            }
          }
        });   
      } else {
        msn.sensors.forEach(mSen => {
          sensors.forEach(sen => {
            if (sen.toLowerCase() === mSen.sensorID.toLowerCase() 
              && senMax < mSen.postflightMinutes) {
              senMax = mSen.postflightMinutes;
            }
          });
        });
      }
      answer += senMax;
    });
    return answer;
  }

  getScheduledTime(sensors: string[], enclave: string, gs?: GroundSystem): number {
    let answer = 0;
    this.missions.forEach(msn => {
      let senMax = 0;
      if (gs && gs.checkForUse) {
        if (msn.equipmentInUse(gs.id)) {
          msn.sensors.forEach(mSen => {
            if (gs.useSensor(msn.platformID, mSen.sensorID, msn.exploitation, 
              msn.communications, enclave)) {
              if (senMax < mSen.scheduledMinutes) {
                senMax = mSen.scheduledMinutes;
              }
            }
          });
        }
      } else if (gs && gs.exploitations.length > 0) {
        msn.sensors.forEach(mSen => {
          if (gs.useSensor(msn.platformID, mSen.sensorID, msn.exploitation, 
            msn.communications, enclave)) {
            if (senMax < mSen.scheduledMinutes) {
              senMax = mSen.scheduledMinutes;
            }
          }
        });   
      } else {
        msn.sensors.forEach(mSen => {
          sensors.forEach(sen => {
            if (sen.toLowerCase() === mSen.sensorID.toLowerCase() 
              && senMax < mSen.scheduledMinutes) {
              senMax = mSen.scheduledMinutes;
            }
          });
        });
      }
      answer += senMax;
    });
    return answer;
  }

  getExecutedTime(sensors: string[], enclave: string, gs?: GroundSystem): number {
    let answer = 0;
    this.missions.forEach(msn => {
      let senMax = 0;
      if (gs && gs.checkForUse) {
        if (msn.equipmentInUse(gs.id)) {
          msn.sensors.forEach(mSen => {
            if (gs.useSensor(msn.platformID, mSen.sensorID, msn.exploitation, 
              msn.communications, enclave)) {
              if (senMax < mSen.executedMinutes) {
                senMax = mSen.executedMinutes;
              }
            }
          });
        }
      } else if (gs && gs.exploitations.length > 0) {
        msn.sensors.forEach(mSen => {
          if (gs.useSensor(msn.platformID, mSen.sensorID, msn.exploitation, 
            msn.communications, enclave)) {
            if (senMax < mSen.executedMinutes) {
              senMax = mSen.executedMinutes;
            }
          }
        });   
      } else {
        msn.sensors.forEach(mSen => {
          sensors.forEach(sen => {
            if (sen.toLowerCase() === mSen.sensorID.toLowerCase() 
              && senMax < mSen.executedMinutes) {
              senMax = mSen.executedMinutes;
            }
          });
        });
      }
      answer += senMax;
    });
    return answer;
  }

  getAdditionalTime(sensors: string[], enclave: string, gs?: GroundSystem): number {
    let answer = 0;
    this.missions.forEach(msn => {
      let senMax = 0;
      if (gs && gs.checkForUse) {
        if (msn.equipmentInUse(gs.id)) {
          msn.sensors.forEach(mSen => {
            if (gs.useSensor(msn.platformID, mSen.sensorID, msn.exploitation, 
              msn.communications, enclave)) {
              if (senMax < mSen.additionalMinutes) {
                senMax = mSen.additionalMinutes;
              }
            }
          });
        }
      } else if (gs && gs.exploitations.length > 0) {
        msn.sensors.forEach(mSen => {
          if (gs.useSensor(msn.platformID, mSen.sensorID, msn.exploitation, 
            msn.communications, enclave)) {
            if (senMax < mSen.additionalMinutes) {
              senMax = mSen.additionalMinutes;
            }
          }
        });   
      } else {
        msn.sensors.forEach(mSen => {
          sensors.forEach(sen => {
            if (sen.toLowerCase() === mSen.sensorID.toLowerCase() 
              && senMax < mSen.additionalMinutes) {
              senMax = mSen.additionalMinutes;
            }
          });
        });
      }
      answer += senMax;
    });
    return answer;
  }

  getOverlap(): number {
    let answer = 0;
    this.missions.forEach(msn => {
      answer += msn.missionOverlap;
    });
    return answer;
  }

  getSensorList(): string[] {
    const answer: string[] = [];
    this.missions.forEach(msn => {
      msn.sensors.forEach(mSen => {
        let found = false;
        answer.forEach(sen => {
          if (mSen.sensorID.toLowerCase() === sen.toLowerCase()) {
            found = true;
          }
        });
        if (!found) {
          answer.push(mSen.sensorID);
        }
      });
    })
    return answer;
  }
}