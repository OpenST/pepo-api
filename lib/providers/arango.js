const ArangoClient = require('arangojs');

const rootPrefix = '../..',
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy'),
  arangoConstants = require(rootPrefix + '/lib/globalConstant/arango');

/**
 * Class for arango provider.
 *
 * @class Arango
 */
class Arango {
  /**
   * Get instance method of arango.
   *
   * @returns {Promise<*>}
   */
  async getInstance() {
    const configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy');

    const arangoConfigResponse = await configStrategyProvider.getConfigForKind(configStrategyConstants.arango);

    if (arangoConfigResponse.isFailure()) {
      return arangoConfigResponse;
    }

    const arangoConfig = arangoConfigResponse.data[configStrategyConstants.arango];

    const arangoConfigStrategy = {
      url: arangoConfig.url
    };

    const db = new ArangoClient.Database(arangoConfigStrategy);
    db.useDatabase(arangoConstants.mainDbName);
    db.useBasicAuth(arangoConfig.userName, arangoConfig.password);

    return db;
  }
}

module.exports = new Arango();
