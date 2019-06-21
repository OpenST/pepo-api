const rootPrefix = '../..',
  ConfigStrategyCache = require(rootPrefix + '/lib/cacheManagement/single/ConfigStrategy'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

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
    return new ConfigStrategyCache().fetch();
  }

  /**
   * Get config strategy for kind.
   *
   * @param {string} kind
   *
   * @returns {Promise<result>}
   */
  async getConfigForKind(kind) {
    if (!configStrategyConstants.invertedKinds[kind]) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_p_cs_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { kind: kind }
        })
      );
    }

    const completeConfigStrategy = await new ConfigStrategyCache().fetch();

    if (completeConfigStrategy.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_p_cs_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    const configStrategyForKind = completeConfigStrategy.data[kind];

    if (!configStrategyForKind) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_p_cs_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: {}
        })
      );
    }

    return responseHelper.successWithData({ [kind]: configStrategyForKind });
  }
}

module.exports = new ConfigStrategy();
