const rootPrefix = '../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  kmsPurposeConstants = require(rootPrefix + '/lib/globalConstant/kms'),
  globalSaltModel = require(rootPrefix + '/app/models/mysql/GlobalSalt'),
  globalSaltConstant = require(rootPrefix + '/lib/globalConstant/globalSalt'),
  ConfigStrategyModel = require(rootPrefix + '/app/models/mysql/ConfigStrategy'),
  configStrategyConstant = require(rootPrefix + '/lib/globalConstant/configStrategy');

const command = require('commander'),
  path = require('path'),
  appRootPath = path.resolve(__dirname, rootPrefix);

command
  .version('0.1.0')
  .usage('[options]')
  .option('-g, --add-configs', 'Add config')
  .option('-t, --activate-configs', 'Activate config')
  .option('-f, --config-file-path <required>', 'Config file absolute path for action -g')
  .option('-f, --kind <kind>', 'kind of the config strategy') // Comma separated kinds should be there.
  .parse(process.argv);

const handleError = function() {
  command.outputHelp();
  throw new Error('Required parameters are missing!');
};

const Main = async function() {
  const oThis = this;

  const configFilePath =
    command.configFilePath === undefined
      ? `${appRootPath}/config-samples/development/global_config.json`
      : command.configFilePath;

  const configData = require(configFilePath);
  oThis.config = configData.config;

  if (command.addConfigs) {
    await new globalSaltModel().createEncryptionSalt(
      kmsPurposeConstants.configStrategyEncryptionPurpose,
      globalSaltConstant.configStrategyKind
    );
    await _addConfig(oThis.config);
  } else if (command.activateConfigs) {
    await _activateConfigStrategy(oThis.config);
  } else {
    return handleError();
  }
};

/**
 * Add Config Strategy.
 *
 * @param {object} config: config JSON
 *
 * @returns {Promise<*>}
 * @private
 */
const _addConfig = async function(config) {
  if (command.kind) {
    const kinds = command.kind.split(',');
    for (let index = 0; index < kinds.length; index++) {
      const kind = kinds[index];
      await _validateKind(kind);
      await _create(kind, config);
    }
  } else {
    for (const kind in config) {
      await _validateKind(kind);
      await _create(kind, { [kind]: config[kind] });
    }
  }
};

/**
 * Create Config Strategy.
 *
 * @param {string} kind: Config kind
 * @param {object} configParams: config JSON
 *
 * @returns {Promise<*>}
 * @private
 */
const _create = async function(kind, configParams) {
  logger.step(`** Adding entry for ${kind} in config startegy`);

  return new ConfigStrategyModel().create(kind, configParams);
};

/**
 * Activate Config Strategy.
 *
 * @param {object} config: config JSON
 *
 * @returns {Promise<*>}
 * @private
 */
const _activateConfigStrategy = async function(config) {
  if (command.kind) {
    const kinds = command.kind.split(',');
    for (let index = 0; index < kinds.length; index++) {
      const kind = kinds[index];
      await _validateKind(kind);
      await _activate(kind);
    }
  } else {
    for (const kind in config) {
      await _validateKind(kind);
      await _activate(kind);
    }
  }
};

/**
 * Activate Config Strategy.
 *
 * @param {string} kind: Config kind
 *
 * @returns {Promise<*>}
 * @private
 */
const _activate = async function(kind) {
  logger.step(`** Activating Config Strategy for ${kind}`);

  return new ConfigStrategyModel().activateByKind(kind);
};

/**
 * Validate kind.
 *
 * @param {string} kind: Config kind
 *
 * @returns {Promise<*>}
 * @private
 */
const _validateKind = async function(kind) {
  if (configStrategyConstant.mandatoryKinds[kind] !== 1) {
    return Promise.reject(
      responseHelper.error({
        internal_error_identifier: 'd_e_cs_1',
        api_error_identifier: 'something_went_wrong',
        debug_options: { kind: kind }
      })
    );
  }
};

Main()
  .then(function(data) {
    logger.win('\nMain data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('\nMain error: ', err);
    process.exit(1);
  });
