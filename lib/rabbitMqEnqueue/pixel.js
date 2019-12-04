const rootPrefix = '../..',
  RabbitMqEnqueueBase = require(rootPrefix + '/lib/rabbitMqEnqueue/Base'),
  rabbitMqProvider = require(rootPrefix + '/lib/providers/rabbitMq'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  configStrategyConstants = require(rootPrefix + '/lib/globalConstant/configStrategy');

/**
 * Class for pixel job enqueue.
 *
 * @class PixelEnqueue
 */
class PixelEnqueue extends RabbitMqEnqueueBase {
  /**
   * Get rabbitMq provider.
   *
   * @returns {string}
   */
  getRmqProvider() {
    return rabbitMqProvider.getInstance(configStrategyConstants.pixelRabbitmq, machineKindConstant.appServerKind);
  }

  /**
   * Returns job processor class.
   *
   * @returns {any}
   */
  get jobProcessorFactory() {
    return require(rootPrefix + '/lib/jobs/pixel/fire');
  }

  /**
   * Process the publish params without enqueuing.
   *
   * @param {object} publishEventParams
   *
   * @returns {Promise<*>}
   */
  async processWithoutEnqueue(publishEventParams) {
    const oThis = this;

    return oThis.jobProcessorFactory.perform(publishEventParams.message.payload);
  }
}

module.exports = new PixelEnqueue();
