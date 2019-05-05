const Debug = require('debug');
/* eslint-disable-next-line no-unused-vars */
const log = Debug('loopIO:log');
const error = Debug('loopIO:error');
const debug = Debug('loopIO:debug');

const chokidar = require('chokidar');
const fs = require('fs');
const moment = require('moment');

module.exports = (io, options) => {
  const openapsDir = options.openaps;

  let iob;
  let enacted;

  const readIOB = (path) => {
    debug(`Reading file ${path}`);
    setTimeout(() => {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) {
          error(`Error reading file: ${path}`);
          return; // we'll not consider error handling for now
        }
        try {
          const obj = JSON.parse(data);
          [{ iob }] = obj;
          io.emit('iob', iob);
        } catch (e) {
          error(`Error parsing JSON file: ${path}`);
        }
      });
    }, 1000);
  };
  chokidar.watch(`${openapsDir}/monitor/iob.json`)
    .on('change', readIOB)
    .on('add', readIOB);

  const readEnacted = (path) => {
    debug(`Reading file ${path}`);
    // use timeout of 1 s to make sure the write operation is finished
    // as per https://github.com/paulmillr/chokidar/issues/365#issuecomment-146896170
    setTimeout(() => {
      fs.readFile(path, 'utf8', (err, data) => {
        if (err) return; // we'll not consider error handling for now
        try {
          const obj = JSON.parse(data);
          enacted = (({
            timestamp,
            rate,
            duration,
            units,
            COB,
          }) => ({
            date: moment(timestamp).toDate().getTime(),
            rate,
            duration,
            units,
            COB,
          }))(obj);
          debug('Enacted:\n%O', enacted);
          io.emit('enacted', enacted);
        } catch (e) {
          error(`Error parsing JSON file: ${path}`);
        }
      });
    }, 1000);
  };
  chokidar.watch(`${openapsDir}/enact/enacted.json`)
    .on('change', readEnacted)
    .on('add', readEnacted);

  io.on('connection', (socket) => {
    socket.emit('iob', iob);
    socket.emit('enacted', enacted);
    // iob = require('/root/myopenaps/monitor/iob.json');
    // socket.emit('iob', iob[0]['iob']);
  });
};
