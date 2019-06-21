const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  InsertCrons = require(rootPrefix + '/lib/cronProcess/InsertCrons');

const command = require('commander'),
  path = require('path'),
  appRootPath = path.resolve(__dirname, rootPrefix);

command
  .usage('[options]')
  .option('-f, --config-file-path <required>', 'Config file absolute path')
  .option('-kinds, --kinds <required>', 'Kinds')
  .parse(process.argv);

class CronSeeder {
  constructor(command1, command2) {
    const oThis = this;

    oThis.configFilePath = command.configFilePath;
    oThis.kinds = command.kinds;
  }

  async perform() {
    const oThis = this;

    if (oThis.configFilePath === undefined) {
      oThis.configFilePath = `${appRootPath}/lib/cronProcess/cronSample.json`;
    }

    await oThis._seed();
  }

  async _seed() {
    const oThis = this;

    const configData = require(oThis.configFilePath),
      allCronKinds = Object.keys(configData);

    console.log('allCronKinds-----', allCronKinds);

    // dhananjay - HERE: check if kinds are present in allCronKinds
    let kindsToInsert = oThis.kinds ? basicHelper.commaSeperatedStrToArray(oThis.kinds) : allCronKinds;

    for (let index = 0; index < kindsToInsert.length; index++) {
      const cronParams = configData[kindsToInsert[index]];
      let insertCronRsp = new InsertCrons({
        cronKindName: kindsToInsert[index],
        cronParams: cronParams
      }).perform();

      //dhananjay - HERE: handle error
      console.log('insertCronRsp-----', insertCronRsp);
    }
  }
}

new CronSeeder(command.configFilePath, command.kinds)
  .then(function(data) {
    console.error('\nSuccess data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    console.error('\nError data: ', err);
    process.exit(1);
  });
