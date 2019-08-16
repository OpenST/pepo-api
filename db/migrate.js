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
  ExecuteCassandraQuery = require(rootPrefix + '/db/ExecuteCassandraQuery'),
  database = require(rootPrefix + '/lib/globalConstant/database'),
  DbKindConstant = require(rootPrefix + '/lib/globalConstant/dbKind'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const migrationFolder = __dirname + '/migration',
  mainDbName = database.mainDbName;

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

  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    oThis
      ._asyncPerform()
      .then(function() {
        logger.win('Done!');
        process.exit(0);
      })
      .catch(function(err) {
        logger.error(err);
        process.exit(1);
      });
  }

  /**
   * Async perform.
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
      const existingVersionArr = Object.keys(oThis.existingVersionMap);
      existingVersionArr.sort();

      if (existingVersionArr.length === 0) {
        return null;
      }

      // Looping over the existing versions to run the migrations in reverse order.
      for (let index = existingVersionArr.length - 1; index > -1; index--) {
        const currentVersion = existingVersionArr[index];
        await oThis._revertMigration(currentVersion);
      }

      // Looping over the existing versions to run the migrations in reverse order.
      for (let index = 0; index < existingVersionArr.length; index++) {
        const currentVersion = existingVersionArr[index];
        await oThis._runMigration(currentVersion);
      }
    } else {
      oThis._findMissingVersions();

      // Looping over the missing versions to run the migrations.
      for (let index = 0; index < oThis.missingVersions.length; index++) {
        const version = oThis.missingVersions[index];

        await oThis._runMigration(version);
      }
    }
  }

  /**
   * Run migration.
   *
   * @param {string} version
   *
   * @return {Promise<void>}
   * @private
   */
  async _runMigration(version) {
    const oThis = this;

    const migrationFile = oThis.allVersionMap[version];

    logger.log('-----------------------------------------');
    logger.step('Executing migration version(', version, ')');

    const versionInfo = require(migrationFolder + '/' + migrationFile);

    for (let index = 0; index < versionInfo.up.length; index++) {
      const query = versionInfo.up[index];

      await oThis._ExecuteQueryForDbKind(versionInfo, query);
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

    const migrationFile = oThis.allVersionMap[version];

    logger.log('-----------------------------------------');
    logger.step('Reverting migration version(', version, ')');

    const versionInfo = require(migrationFolder + '/' + migrationFile);

    for (let index = 0; index < versionInfo.down.length; index++) {
      const query = versionInfo.down[index];

      await oThis._ExecuteQueryForDbKind(versionInfo, query);
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

    for (let index = 0; index < fileNames.length; index++) {
      const currFile = fileNames[index];
      const currVersion = currFile.split('_')[0];

      if (currVersion) {
        oThis.allVersionMap[currVersion] = currFile;
      }
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

    const versionQueryResult = await new ExecuteQuery(mainDbName, schemaMigrationQuery).perform();

    const rows = (versionQueryResult || [])[0] || [];

    for (let index = 0; index < rows.length; index++) {
      const currRow = rows[index];

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

    for (const version in oThis.allVersionMap) {
      if (!oThis.existingVersionMap[version]) {
        oThis.missingVersions.push(parseInt(version));
      }
    }

    oThis.missingVersions.sort();
  }

  /**
   * Execute query for dbKind
   *
   * @param versionInfo
   * @param query
   * @returns {Promise<void>}
   * @private
   */
  async _ExecuteQueryForDbKind(versionInfo, query) {
    let dbName = versionInfo.dbName;
    let keySpace = versionInfo.keySpace;
    let dbKind = versionInfo.dbKind;
    if (dbKind == DbKindConstant.sqlDbKind) {
      return new ExecuteQuery(dbName, query).perform();
    } else if (dbKind == DbKindConstant.cassandraDbKind) {
      return new ExecuteCassandraQuery(keySpace, query).perform();
    } else throw new Error(`Invalid dbKind-${dbKind}`);
  }
}

if (program.generate) {
  const fileName = migrationFolder + '/' + Date.now() + '_' + program.generate + '.js';
  const fileDummyData =
    'const migrationName = {\n' +
    "  dbName: 'db name here',\n" +
    "  up: ['array of sql queries here'],\n" +
    "  down: ['array of sql queries here'],\n" +
    "  dbKind: 'db kind here',\n" +
    "  keySpace: 'keySpace here'\n" +
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
