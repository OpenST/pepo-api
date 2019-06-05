const program = require('commander'),
  fs = require('fs');

const rootPrefix = '..',
  coreConstants = require(rootPrefix + '/config/coreConstants');

// commander
program
  .version('0.1.0')
  .option('--migrationName <migrationName>', 'Migration Name, mandatory param')
  .parse(process.argv);

/**
 *
 * Class for generate Migration
 * @class
 *
 * node db/generateMigration.js --migrationName "create_test_table"
 */
class GenerateMigration {
  constructor() {}

  perform() {
    let fileName = coreConstants.MIGRATION_FOLDER_FILE_PATH + Date.now() + '_' + program.migrationName + '.js';
    let fileDummyData =
      'const migrationName = {\n' +
      "  dbName: 'db name here',\n" +
      "  up: 'sql query here',\n" +
      "  down: 'sql query here'\n" +
      '};\n' +
      '\n' +
      'module.exports = migrationName;';

    fs.appendFile(fileName, fileDummyData, function(err) {
      if (err) {
        return console.log(err);
      }

      console.log('The file ' + fileName + ' is created!');
    });
  }
}

new GenerateMigration().perform();
