const rootPrefix = '..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  rabbitmqProvider = require(rootPrefix + '/lib/providers/bgJobRabbitmq');

class BgJob {
  static async enqueue(topic, messageParams) {
    logger.log('enqueue called for topic:', topic, 'with params:', messageParams);

    const ostNotification = await rabbitmqProvider.getInstance(machineKindConstant.appServerKind);

    return ostNotification.publishEvent.perform({
      topics: [topic],
      publisher: 'PEPO',
      message: {
        kind: topic,
        payload: messageParams
      }
    });
  }
}

module.exports = BgJob;
