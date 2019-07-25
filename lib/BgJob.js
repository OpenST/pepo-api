const rootPrefix = '..',
  BgJobConstant = require(rootPrefix + '/lib/globalConstant/bgJob'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  rabbitmqProvider = require(rootPrefix + '/lib/providers/bgJobRabbitmq'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  bgJobProcessorFactory = require(rootPrefix + '/executables/bgJobProcessor/factory');

class BgJob {
  static async enqueue(topic, messageParams, options) {
    logger.log('Enqueue called for topic:', topic, 'with params:', messageParams);

    const ostNotification = await rabbitmqProvider.getInstance(machineKindConstant.appServerKind);

    const enqueueOptions = options || {};
    const publishAfter = enqueueOptions.publishAfter;

    let publishEventParams = {
      topics: [topic],
      publisher: 'PEPO',
      message: {
        kind: topic,
        payload: messageParams
      }
    };

    if (!CommonValidators.isVarNullOrUndefined(publishAfter)) {
      if (CommonValidators.isVarNullOrUndefined(BgJobConstant.allowedPublishedAfterTimes[publishAfter])) {
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
