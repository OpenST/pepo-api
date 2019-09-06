const uuidV4 = require('uuid/v4');

module.exports = function() {
  return function(req, res, next) {
    req.id = uuidV4();
    req.startTime = process.hrtime();
    next();
  };
};
