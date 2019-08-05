const rootPrefix = '..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  bgJobProcessorFactory = require(rootPrefix + '/executables/bgJobProcessor/factory'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for Bg job.
 *
 * @class BgJob
 */
class BgJob {
  /**
   * Enqueue message.
   *
   * @param {string} topic
   * @param {object} messageParams
   * @param {object} [options]
   * @param {string} [options.publishAfter]
   *
   * @returns {Promise<*>}
   */
  static async enqueue(topic, messageParams, options = {}) {
    logger.log('Enqueue called for topic:', topic, 'with params:', messageParams);

    const ostNotification = await rabbitMqProvider.getInstance(
      configStrategyConstants.bgJobRabbitmq,
      machineKindConstant.appServerKind
    );

    const publishAfter = options.publishAfter;

    const publishEventParams = {
      topics: [topic],
      publisher: 'PEPO',
      message: {
        kind: topic,
        payload: messageParams
      }
    };

    if (!CommonValidators.isVarNullOrUndefined(publishAfter)) {
      if (CommonValidators.isVarNullOrUndefined(bgJobConstants.allowedPublishedAfterTimes[publishAfter])) {
        return responseHelper.error({
          internal_error_identifier: 'l_bj_e_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { publishAfter: publishAfter }
        });
      }
      publishEventParams.publishAfter = publishAfter; // Message to be sent after milliseconds.
    }

    return ostNotification.publishEvent.perform(publishEventParams).catch(async function(error) {
      logger.log('error =====', error);

      const errorObj = responseHelper.error({
        internal_error_identifier: 'l_bj_e_2',
        api_error_identifier: 'something_went_wrong',
        debug_options: { error: error }
      });

      await createErrorLogsEntry.perform(errorObj, errorLogsConstants.highSeverity);

      return bgJobProcessorFactory.getInstance(publishEventParams).perform();
    });
  }
}

module.exports = BgJob;
