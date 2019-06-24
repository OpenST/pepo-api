const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  InsertCrons = require(rootPrefix + '/lib/cronProcess/InsertCrons');

const command = require('commander'),
  path = require('path'),
  appRootPath = path.resolve(__dirname, rootPrefix);

command
  .usage('[options]')
  .option('-f, --config-file-path <required>', 'Config file absolute path')
  .option('--kinds <required>', 'Kinds Array')
  .parse(process.argv);

class CronSeeder {
  constructor(params) {
    const oThis = this;

    oThis.configFilePath = params.configFilePath;
    oThis.kinds = params.kinds;
  }

  /**
   * Async performer.
   *
   * @returns {Promise<boolean>}
   */
  async perform() {
    const oThis = this;

    if (oThis.configFilePath === undefined) {
      oThis.configFilePath = `${appRootPath}/lib/cronProcess/cronSample.json`;
    }

    return oThis._seed();
  }

  /**
   * Seed cron processes.
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _seed() {
    const oThis = this;

    const configData = require(oThis.configFilePath),
      allCronKinds = Object.keys(configData);

    let kindsToInsert = oThis.kinds ? basicHelper.commaSeperatedStrToArray(oThis.kinds) : allCronKinds;

    for (let index = 0; index < kindsToInsert.length; index++) {
      const cronParams = configData[kindsToInsert[index]],
        insertCronRsp = await new InsertCrons({
          cronKindName: kindsToInsert[index],
          cronParams: cronParams
        })
          .perform()
          .catch(function(error) {
            logger.error('Error in insertCronRsp-----', error);
          });
      logger.log('insertCronRsp-----', insertCronRsp);
    }

    return true;
  }
}

const cronSeeder = new CronSeeder({ configFilePath: command.configFilePath, kinds: command.kinds });

cronSeeder
  .perform()
  .then(function(data) {
    logger.log('\nSuccess data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('\nError data: ', err);
    process.exit(1);
  });
