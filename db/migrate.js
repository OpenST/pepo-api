const fs = require('fs'),
  program = require('commander');

program
  .option('--up <up>', 'Specify a specific migration version to perform.')
  .option('--down <down>', 'Specify a specific migration version to revert.')
  .option('--redo <redo>', 'Specify a specific migration version to redo.')
  .option('--redoAll', 'Rerun all the migrations')
  .option('--generate <name>', 'Specify migration name to generate with bare minimum content.')
  .parse(process.argv);

const rootPrefix = '..',
  ExecuteQuery = require(rootPrefix + '/db/ExecuteQuery'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const migrationFolder = __dirname + '/migration',
  mainDbName = 'pepo_api_' + coreConstants.environment;

class DbMigrate {
  /**
   * Constructor
   */
  constructor() {
    const oThis = this;

    oThis.upVersion = program.up;
    oThis.downVersion = program.down;
    oThis.redoVersion = program.redo;
    oThis.redoAllVersion = program.redoAll;

    oThis.allVersionMap = {};
    oThis.existingVersionMap = {};
    oThis.missingVersions = [];
  }

  async perform() {
    const oThis = this;

    oThis
      ._asyncPerform()
      .then(function() {
        logger.win('Done!');
      })
      .catch(function(err) {
        logger.error(err);
      });
  }

  /**
   * Async perform
   *
   * @return {Promise<void>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    oThis._fetchAllVersions();

    await oThis._fetchExistingVersions();

    if (oThis.upVersion) {
      if (oThis.existingVersionMap[oThis.upVersion]) {
        throw new Error(
          'Migration version ' + oThis.upVersion + ' is already up. If you want to re-run it, use redo flag.'
        );
      }
      await oThis._runMigration(oThis.upVersion);
    } else if (oThis.downVersion) {
      if (!oThis.existingVersionMap[oThis.downVersion]) {
        throw new Error('Migration version ' + oThis.downVersion + ' is NOT up. Reverting it is not allowed.');
      }
      await oThis._revertMigration(oThis.downVersion);
    } else if (oThis.redoVersion) {
      if (!oThis.existingVersionMap[oThis.redoVersion]) {
        throw new Error('Migration version ' + oThis.redoVersion + ' is NOT up. Re-doing it is not allowed.');
      }
      await oThis._revertMigration(oThis.redoVersion);
      await oThis._runMigration(oThis.redoVersion);
    } else if (oThis.redoAllVersion) {
      let existingVersionArr = Object.keys(oThis.existingVersionMap);
      existingVersionArr.sort();

      if (existingVersionArr.length == 0) {
        return null;
      }

      // looping over the existing versions to run the migrations in reverse order
      for (let i = existingVersionArr.length - 1; i > -1; i--) {
        let currentVersion = existingVersionArr[i];
        await oThis._revertMigration(currentVersion);
      }

      // looping over the existing versions to run the migrations in reverse order
      for (let i = 0; i < existingVersionArr.length; i++) {
        let currentVersion = existingVersionArr[i];
        await oThis._runMigration(currentVersion);
      }
    } else {
      oThis._findMissingVersions();

      // looping over the missing versions to run the migrations
      for (let i = 0; i < oThis.missingVersions.length; i++) {
        let version = oThis.missingVersions[i];

        await oThis._runMigration(version);
      }
    }
  }

  /**
   * Run migration
   *
   * @param version
   * @return {Promise<void>}
   * @private
   */
  async _runMigration(version) {
    const oThis = this;

    let migrationFile = oThis.allVersionMap[version];

    logger.log('-----------------------------------------');
    logger.step('Executing migration version(', version, ')');

    let versionInfo = require(migrationFolder + '/' + migrationFile);

    for (let i = 0; i < versionInfo.up.length; i++) {
      let sql = versionInfo.up[i];

      await new ExecuteQuery(versionInfo.dbName, sql).perform();
    }

    const insertVersionSql = "INSERT INTO `schema_migrations` (`version`) VALUES('" + version + "')";

    await new ExecuteQuery(mainDbName, insertVersionSql).perform();

    logger.win('Executed migration version(', version, ')');
    logger.log('-----------------------------------------');
  }

  /**
   * Revert migration
   *
   * @param version
   * @return {Promise<void>}
   * @private
   */
  async _revertMigration(version) {
    const oThis = this;

    let migrationFile = oThis.allVersionMap[version];

    logger.log('-----------------------------------------');
    logger.step('Reverting migration version(', version, ')');

    let versionInfo = require(migrationFolder + '/' + migrationFile);

    for (let i = 0; i < versionInfo.down.length; i++) {
      let sql = versionInfo.down[i];

      await new ExecuteQuery(versionInfo.dbName, sql).perform();
    }

    const insertVersionSql = "DELETE FROM `schema_migrations` WHERE `version`='" + version + "'";

    await new ExecuteQuery(mainDbName, insertVersionSql).perform();

    logger.win('Reverted migration version(', version, ')');
    logger.log('-----------------------------------------');
  }

  /**
   * Fetch all versions
   *
   * @private
   */
  _fetchAllVersions() {
    const oThis = this;

    const fileNames = fs.readdirSync(migrationFolder);

    for (let i = 0; i < fileNames.length; i++) {
      let currFile = fileNames[i];
      let currVersion = currFile.split('_')[0];

      if (currVersion) oThis.allVersionMap[currVersion] = currFile;
    }
  }

  /**
   * Fetch existing versions
   *
   * @return {Promise<void>}
   * @private
   */
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

  /**
   * Find missing versions and sort them
   *
   * @private
   */
  _findMissingVersions() {
    const oThis = this;

    for (let version in oThis.allVersionMap) {
      if (!oThis.existingVersionMap[version]) oThis.missingVersions.push(parseInt(version));
    }

    oThis.missingVersions.sort();
  }
}

if (program.generate) {
  let fileName = migrationFolder + '/' + Date.now() + '_' + program.generate + '.js';
  let fileDummyData =
    'const migrationName = {\n' +
    "  dbName: 'db name here',\n" +
    "  up: ['array of sql queries here'],\n" +
    "  down: ['array of sql queries here']\n" +
    '};\n' +
    '\n' +
    'module.exports = migrationName;';

  fs.appendFile(fileName, fileDummyData, function(err) {
    if (err) {
      logger.error(err);
    }

    logger.log('The file ' + fileName + ' is created!');
  });
} else {
  new DbMigrate().perform();
}
