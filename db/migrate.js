const fs = require('fs'),
  program = require('commander');

program
  .option('--up <up>', 'Version to perform the migration.')
  .option('--down <down>', 'Version to revert the migration.')
  .parse(process.argv);

const rootPrefix = '..',
  ExecuteQuery = require(rootPrefix + '/db/ExecuteQuery'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const migrationFolder = __dirname + '/migration',
  mainDbName = 'pepo_api_' + coreConstants.environment;

class RunDbMigrate {
  constructor() {
    const oThis = this;

    oThis.allVersionMap = {};
    oThis.existingVersionMap = {};
    oThis.missingVersions = [];
  }

  async perform() {
    const oThis = this;

    oThis._fetchAllVersions();

    if (program.up) {
      await oThis._runMigration(program.up);
    } else if (program.down) {
      await oThis._revertMigration(program.down);
    } else {
      await oThis._fetchExistingVersions();

      oThis._findMissingVersions();

      // looping over the missing versions to run the migrations
      for (let i = 0; i < oThis.missingVersions.length; i++) {
        let version = oThis.missingVersions[i];

        await oThis._runMigration(version);
      }
    }
  }

  async _runMigration(version) {
    const oThis = this;

    let migrationFile = oThis.allVersionMap[version];

    logger.log('-----------------------------------------');
    logger.step('Executing migration version(', version, ')');

    let versionInfo = require(migrationFolder + '/' + migrationFile);

    await new ExecuteQuery(versionInfo.dbName, versionInfo.up).perform();

    const insertVersionSql = "INSERT INTO `schema_migrations` (`version`) VALUES('" + version + "')";

    await new ExecuteQuery(mainDbName, insertVersionSql).perform();

    logger.win('Executed migration version(', version, ')');
    logger.log('-----------------------------------------');
  }

  async _revertMigration(version) {
    const oThis = this;

    let migrationFile = oThis.allVersionMap[version];

    logger.log('-----------------------------------------');
    logger.step('Reverting migration version(', version, ')');

    let versionInfo = require(migrationFolder + '/' + migrationFile);

    await new ExecuteQuery(versionInfo.dbName, versionInfo.down).perform();

    const insertVersionSql = "DELETE FROM `schema_migrations` WHERE `version`='" + version + "'";

    await new ExecuteQuery(mainDbName, insertVersionSql).perform();

    logger.win('Reverted migration version(', version, ')');
    logger.log('-----------------------------------------');
  }

  _fetchAllVersions() {
    const oThis = this;

    const fileNames = fs.readdirSync(migrationFolder);

    for (let i = 0; i < fileNames.length; i++) {
      let currFile = fileNames[i];
      let currVersion = currFile.split('_')[0];

      if (currVersion) oThis.allVersionMap[currVersion] = currFile;
    }
  }

  async _fetchExistingVersions() {
    const oThis = this;

    const schemaMigrationQuery = 'SELECT * FROM schema_migrations;';

    let versionQueryResult = await new ExecuteQuery(mainDbName, schemaMigrationQuery).perform();

    let rows = (versionQueryResult || [])[0] || [];

    for (let i = 0; i < rows.length; i++) {
      let currRow = rows[i];

      oThis.existingVersionMap[currRow.version] = 1;
    }
  }

  _findMissingVersions() {
    const oThis = this;

    for (let version in oThis.allVersionMap) {
      if (!oThis.existingVersionMap[version]) oThis.missingVersions.push(parseInt(version));
    }

    oThis.missingVersions.sort();
  }
}

new RunDbMigrate().perform();
