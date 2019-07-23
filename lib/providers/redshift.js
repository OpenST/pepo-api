const RedshiftClient = require('node-redshift');

const rootPrefix = '../..',
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for redshift provider.
 *
 * @class Redshift
 */
class Redshift {
  /**
   * Get instance method of redshift.
   *
   * @returns {Promise<*>}
   */
  async getInstance() {
    const configStrategyProvider = require(rootPrefix + '/lib/providers/configStrategy');

    const redshiftConfigResponse = await configStrategyProvider.getConfigForKind(configStrategyConstants.redshift);

    if (redshiftConfigResponse.isFailure()) {
      return redshiftConfigResponse;
    }

    const redshiftConfig = redshiftConfigResponse.data[configStrategyConstants.redshift];

    const redshiftConfigStrategy = {
      user: redshiftConfig.user,
      database: redshiftConfig.database,
      password: redshiftConfig.password,
      port: redshiftConfig.port,
      host: redshiftConfig.host
    };

    return new RedshiftClient(redshiftConfigStrategy);
  }
}

module.exports = new Redshift();
