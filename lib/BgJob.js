const rootPrefix = '..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  BgJobconstant = require(rootPrefix + '/lib/globalConstant/bgJob'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  rabbitmqProvider = require(rootPrefix + '/lib/providers/bgJobRabbitmq');

class BgJob {
  static async enqueue(topic, messageParams, options) {
    logger.log('enqueue called for topic:', topic, 'with params:', messageParams);

    const ostNotification = await rabbitmqProvider.getInstance(machineKindConstant.appServerKind);

    const publishAfter = options.publishAfter;

    let publishEventParams = {
      topics: [topic],
      publisher: 'PEPO',
      publishAfter: publishAfter, // message to be sent after milliseconds.
      message: {
        kind: topic,
        payload: messageParams
      }
    };

    if (!CommonValidators.isVarNullOrUndefined(publishAfter)) {
      if (CommonValidators.isVarNullOrUndefined(BgJobconstant.allowedPublishedAfterTimes[publishAfter])) {
        return responseHelper.error({
          internal_error_identifier: 'l_bj_e_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { publishAfter: publishAfter }
        });
      }
      publishEventParams.publishAfter = publishAfter;
    }

    return ostNotification.publishEvent.perform(publishEventParams);
  }
}

module.exports = BgJob;
