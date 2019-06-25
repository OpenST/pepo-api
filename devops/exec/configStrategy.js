const rootPrefix = '../..',
  ConfigStrategyModel = require(rootPrefix + '/app/models/mysql/ConfigStrategy'),
  configStrategyConstant = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  GlobalSaltModel = require(rootPrefix + '/app/models/mysql/GlobalSalt');

const command = require('commander'),
  path = require('path'),
  appRootPath = path.resolve(__dirname, rootPrefix);

command
  .version('0.1.0')
  .usage('[options]')
  .option('-g, --add-configs', 'Add config')
  .option('-t, --activate-config', 'Activate config')
  .option('-f, --config-file-path <required>', 'Config file absolute path for action -g')
  .option('-f, --kind <required>', 'kind of the config strategy')
  .parse(process.argv);

const handleError = function() {
  command.outputHelp();
  throw 'Required parameters are missing!';
};

const Main = async function() {
  const oThis = this;
  let kind = command.kind;
  if (command.addConfigs) {
    let configFilePath =
      command.configFilePath === undefined
        ? `${appRootPath}/config-samples/development/global_config.json`
        : command.configFilePath;
    let invertedKind = configStrategyConstant.invertedKinds[kind];
    if (configStrategyConstant.mandatoryKinds[kind] !== 1) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: `d_e_cs_1`,
          api_error_identifier: 'something_went_wrong',
          debug_options: { kind: oThis.kind }
        })
      );
    }

    const configData = require(configFilePath);
    let allParams = configData['config'];
    let encryptionSaltId = await new GlobalSaltModel().getEncryptionSaltId(invertedKind);

    return new ConfigStrategyModel().create(kind, allParams, encryptionSaltId.id);
  } else if (command.activateConfig) {
    if (!kind) {
      handleError();
    }

    return new ConfigStrategyModel().activateByKind(kind);
  } else {
    return handleError();
  }
};

Main()
  .then(function(data) {
    console.error('\nMain data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    console.error('\nMain error: ', err);
    process.exit(1);
  });
