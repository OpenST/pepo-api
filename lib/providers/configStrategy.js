const rootPrefix = '../..',
  ConfigStrategyCache = require(rootPrefix + '/lib/cacheManagement/single/ConfigStrategy'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

// Declare constants.
let completeConfigStrategy = null;

/**
 * Class for config strategy provider.
 *
 * @class ConfigStrategy
 */
class ConfigStrategy {
  /**
   * Get complete config strategy.
   *
   * @returns {Promise<result>}
   */
  async getCompleteConfig() {
    if (completeConfigStrategy) {
      return completeConfigStrategy;
    }

    completeConfigStrategy = await new ConfigStrategyCache().fetch();

    if (completeConfigStrategy.isFailure()) {
      return Promise.reject(completeConfigStrategy);
    }

    return completeConfigStrategy;
  }

  /**
   * Get config strategy for kind.
   *
   * @param {string} kind
   *
   * @returns {Promise<result>}
   */
  async getConfigForKind(kind) {
    const oThis = this;

    if (!configStrategyConstants.invertedKinds[kind]) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_p_cs_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: { kind: kind }
        })
      );
    }

    const completeConfig = await oThis.getCompleteConfig();

    if (completeConfig.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_p_cs_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    const configStrategyForKind = completeConfig.data[kind];

    if (!configStrategyForKind) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_p_cs_4',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    return responseHelper.successWithData({ [kind]: configStrategyForKind });
  }
}

module.exports = new ConfigStrategy();
