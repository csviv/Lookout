
const Debug = require('debug');
const exec = require('./childExecPromise');

const log = Debug('fakemeter:log');
const error = Debug('fakemeter:error');
const debug = Debug('fakemeter:debug');

let storage = null;
let options = null;
let online = false;

const testOnline = async () => {
  let status = true;

  const retVal = await exec('lookout_online')
    .catch((err) => {
      const { stdout } = err;
      const { stderr } = err;

      /* eslint-disable no-param-reassign */
      delete err.stdout;
      delete err.stderr;
      /* eslint-enable no-param-reassign */

      error('Online test failed:\n%O', err);
      error('Online test stderr: {%s}', stderr);
      error('Online test stdout: {%s}', stdout);
      status = false;
    });

  if (retVal) {
    debug(`lookout_online stdout: ${retVal.stdout}`);
    debug(`lookout_online stderr: ${retVal.stderr}`);
  }

  return status;
};

const getMeterId = async () => {
  let meterId = await storage.getItem('meterid')
    .catch((err) => {
      error(`Unable to get meterid storage item: ${err}`);
    });

  if (!meterId) {
    meterId = '000000';
    storage.setItem('meterid', meterId)
      .catch((err) => {
        error(`Unable to store meterid storage item: ${err}`);
      });
  }

  return meterId;
};

// Create a Lookout GUI HTTP server
module.exports = (_options, _storage, client) => {
  storage = _storage;
  options = _options;

  // Create an object that can be used
  // to interact with the transmitter.
  const fakeMeter = {
    // provide the current transmitter ID
    getMeterId,

    // Set the meter Id to the value provided
    setMeterId: (value) => {
      storage.setItem('meterid', value)
        .catch((err) => {
          error(`Error saving meterid: ${err}`);
        });

      client.meterId(value);
    },

    // Send glucose to fakemeter
    glucose: async (value) => {
      // trigger online status update. It lags by 1 glucose reading, but
      // doesn't waste time waiting for response from Internet
      testOnline().then((onlineValue) => {
        online = onlineValue;
      });

      const meterId = await getMeterId();

      if (options.fakemeter || (!online && options.offline_fakemeter)) {
        log(`Sending glucose to fakemeter: ${value}`);

        const retVal = await exec(`lookout_fakemeter ${meterId} ${value} ${options.openaps}`)
          .catch((err) => {
            const { stdout } = err;
            const { stderr } = err;

            /* eslint-disable no-param-reassign */
            delete err.stdout;
            delete err.stderr;
            /* eslint-enable no-param-reassign */

            error('Fakemeter failed:\n%O', err);
            error('Fakemeter stderr: {%s}', stderr);
            error('Fakemeter stdout: {%s}', stdout);
          });

        if (retVal) {
          debug(`fakemeter stdout: ${retVal.stdout}`);
          debug(`fakemeter stderr: ${retVal.stderr}`);
        }
      } else if (online && options.offline_fakemeter) {
        log('Not sending glucose to fakemeter because rig is online');
      }
    },
  };

  // Provide the object to the client
  client.setFakeMeter(fakeMeter);

  return fakeMeter;
};
