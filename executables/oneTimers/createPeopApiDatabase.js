const mysql = require('mysql');

const rootPrefix = '../..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

const connection = mysql.createConnection({
  host: coreConstants.MYSQL_HOST,
  user: coreConstants.MYSQL_USER,
  password: coreConstants.MYSQL_PASSWORD
});

connection.connect(function(error) {
  if (error) {
    return console.error('Error: ' + error.message);
  }

  connection.query(`CREATE DATABASE ${coreConstants.PEPO_API_MYSQL_DB}`, function(err) {
    if (err) {
      throw err;
    }
    console.log('Database Created.');
  });

  connection.end(function(err) {
    if (err) {
      return console.log(err.message);
    }
  });
});
