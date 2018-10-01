
/*eslint-disable no-unused-vars*/
module.exports = (options, storage, storageLock, client) => {
/*eslint-enable no-unused-vars*/
  let id = 'ABCDEF';
  const glucose = {
    inSession: true,
    glucose: 120,
    trend: 0,
    readDate: Date.now(),
    state: 6,
    status: 0x83,
    filtered: 120,
    sessionStartDate: Date.now(),
    activationDate: Date.now() - 17*24*60*60*1000
  };
  const glucoseHistory = [
    {readDate: Date.now(), readDateMills: Date.now(), glucose: 100},
    {readDate: Date.now() - 15*60000, readDateMills: Date.now() - 15*60000, glucose: 80}
  ];
  let calibration = {
    date: Date.now() - 12*60*60*1000,
    glucose: 100
  };
  setInterval(() => {
    glucose.glucose += 1;
    glucose.readDate = Date.now();
    glucose.readDateMills = Date.now();
    glucose.trend += 10;
    if (glucose.trend >= 40) {
      glucose.trend -= 70;
    }
    console.log('trend = ' + glucose.trend);
    client.newSGV(glucose);
  }, 60000);

  const transmitterIO = {
    getTxId: () => {
      return id;
    },

    getPending: () => {
      return null;
    },

    getGlucose: async () => {
      return glucose;
    },

    getHistory: async () => {
      return glucoseHistory;
    },

    getLastCal: async () => {
      return calibration;
    },

    resetTx: () => {
    },

    startSensor: () => {
    },

    backStartSensor: () => {
    },

    stopSensor: () => {
    },

    calibrate: () => {
    },

    setTxId: (value) => {
      id = value;
    }
  };

  client.setTransmitter(transmitterIO);

};
