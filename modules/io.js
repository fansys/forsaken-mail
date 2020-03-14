/**
 * Created by Hongcai Deng on 2015/12/28.
 */

'use strict';

let mailin = require('./mailin');
let util  = require('./util')

let onlines = new Map();

module.exports = function(io) {
  mailin.on('message', function(connection, data) {
    let to = data.headers.to.toLowerCase();
    let exp = /[\w\._\-\+]+@[\w\._\-\+]+/i;
    if(exp.test(to)) {
      let matches = to.match(exp);
      let shortid = matches[0].substring(0, matches[0].indexOf('@'));
      // save mail
      util.saveMail(shortid, data)
      if(onlines.has(shortid)) {
        onlines.get(shortid).emit('mail', data);
      }
    }
  });

  io.on('connection', socket => {

    socket.on('request shortid', function() {
      onlines.delete(socket.shortid);
      socket.shortid = util.genShortId(); // generate shortid for a request
      onlines.set(socket.shortid, socket); // add incomming connection to online table
      socket.emit('shortid', socket.shortid);
    });

    socket.on('set shortid', function(id) {
      onlines.delete(socket.shortid);
      socket.shortid = util.genShortId(id);
      onlines.set(socket.shortid, socket);
      socket.emit('shortid', socket.shortid);
    })
    
    socket.on('disconnect', socket => {
      onlines.delete(socket.shortid);
    });
  });
};
