const fs = require('fs');

const rootPrefix = '..',
  ExecuteQuery = require(rootPrefix + '/db/ExecuteQuery'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const migrationFolder = __dirname + '/migration';

class RunDbMigrate {
  constructor() {}

  async perform() {
    const fileNames = fs.readdirSync(migrationFolder);

    const allVersionMap = {};

    for (let i = 0; i < fileNames.length; i++) {
      let currFile = fileNames[i];
      let currVersion = currFile.split('_')[0];

      if (currVersion) allVersionMap[currVersion] = currFile;
      console.log(allVersionMap);
    }

    const dbName = 'pepo_api_' + coreConstants.environment;
    const schemaMigrationQuery = 'SELECT * FROM schema_migrations;';

    let versionQueryResult = await new ExecuteQuery(dbName, schemaMigrationQuery).perform();

    let rows = (versionQueryResult || [])[0] || [];

    const existingVersionMap = {};

    for (let i = 0; i < rows.length; i++) {
      let currRow = rows[i];

      existingVersionMap[currRow.version] = 1;
    }

    let missingVersions = [];

    for (let version in allVersionMap) {
      if (!existingVersionMap[version]) missingVersions.push(parseInt(version));
    }

    existingVersionMap.sort();

    // looping over the missing versions to run the migrations
  }
}

new RunDbMigrate().perform();
