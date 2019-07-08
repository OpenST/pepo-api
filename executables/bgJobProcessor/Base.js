const OSTBase = require('@ostdotcom/base');

const rootPrefix = '../..',
  CronBase = require(rootPrefix + '/executables/CronBase'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ErrorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  rabbitmqProvider = require(rootPrefix + '/lib/providers/bgJobRabbitmq'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  machineKindConstant = require(rootPrefix + '/lib/globalConstant/machineKind'),
  RabbitmqSubscription = require(rootPrefix + '/lib/entity/RabbitSubscription'),
  cronProcessesConstant = require(rootPrefix + '/lib/globalConstant/cronProcesses');

/**
 * Class for multi subscription base.
 *
 * @class BgJobProcessorBase
 */
class BgJobProcessorBase extends CronBase {
  /**
   * Constructor for multi subscription base.
   *
   * @param {Object} params
   * @param {Number} params.cronProcessId
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.subscriptionTopicToDataMap = {};
  }

  /**
   * Validate and sanitize params.
   *
   * @private
   */
  _validateAndSanitize() {
    const oThis = this;

    if (!oThis.prefetchCount) {
      let errMsg = 'Prefetch count un-available in cron params in the database.';
      logger.error(errMsg);
      return Promise.reject(errMsg);
    }

    oThis.prefetchCount = parseInt(oThis.prefetchCount);

    if (!CommonValidators.validateNonZeroInteger(oThis.prefetchCount)) {
      let errMsg = 'Prefetch count is not a valid integer.';
      logger.error(errMsg);
      return Promise.reject(errMsg);
    }

    logger.step('Common validations done.');
  }

  /**
   * Get promise queue manager for subscription topic
   *
   * @param subscriptionTopic {string}
   * @return {*}
   */
  promiseQueueManager(subscriptionTopic) {
    const oThis = this;

    let rabbitmqSubscription = oThis.subscriptionTopicToDataMap[subscriptionTopic];

    // Trying to ensure that there is only one _PromiseQueueManager.
    if (rabbitmqSubscription.promiseQueueManager) return rabbitmqSubscription.promiseQueueManager;

    let qm = new OSTBase.OSTPromise.QueueManager(
      function(...args) {
        // Promise executor should be a static method by itself. We declared an unnamed function
        // which was a static method, and promiseExecutor was passed in the same scope as that
        // of the class with oThis preserved.
        oThis._promiseExecutor(...args);
      },
      {
        name: `${oThis.cronProcessId}_promise_queue_manager`,
        timeoutInMilliSecs: oThis.timeoutInMilliSecs,
        rejectPromiseOnTimeout: true,
        onPromiseTimedout: function(promiseContext) {
          return oThis._onPromiseTimedout(promiseContext);
        }
      }
    );

    rabbitmqSubscription.setPromiseQueueManager(qm);

    return rabbitmqSubscription.promiseQueueManager;
  }

  /**
   * Callback to be executed in case of promise time out.
   *
   * @param {Object} promiseContext
   *
   * @private
   */
  _onPromiseTimedout(promiseContext) {
    const oThis = this;

    logger.error(`${oThis.cronProcessId}_promise_queue_manager:: a promise has timed out.`);

    const errorObject = responseHelper.error({
      internal_error_identifier: 'promise_timedout:e_r_msb_1',
      api_error_identifier: 'promise_timedout',
      debug_options: {
        cronProcessId: oThis.cronProcessId,
        cronName: oThis._cronKind,
        executorParams: promiseContext.executorParams
      }
    });

    createErrorLogsEntry.perform(errorObject, ErrorLogsConstants.highSeverity);
  }

  /**
   * Start the actual functionality of the cron.
   *
   * @returns {Promise<void>}
   *
   * @private
   */
  async _start() {
    const oThis = this;

    oThis._prepareSubscriptionData();

    await oThis._startSubscription();

    return true;
  }

  /**
   * Start subscription
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _startSubscription() {
    const oThis = this;

    for (let i = 0; i < oThis.topics.length; i++) {
      let subscriptionTopic = oThis.topics[i];

      let rabbitmqSubscription = oThis.subscriptionTopicToDataMap[subscriptionTopic];

      const ostNotification = await rabbitmqProvider.getInstance(machineKindConstant.cronKind);

      // below condition is to save from multiple subscriptions by command messages.
      if (!rabbitmqSubscription.isSubscribed()) {
        rabbitmqSubscription.markAsSubscribed();

        oThis.promiseQueueManager(subscriptionTopic);

        if (rabbitmqSubscription.consumerTag) {
          process.emit('RESUME_CONSUME', rabbitmqSubscription.consumerTag);
        } else {
          ostNotification.subscribeEvent
            .rabbit(
              [rabbitmqSubscription.topic],
              {
                queue: rabbitmqSubscription.queue,
                ackRequired: oThis.ackRequired,
                prefetch: rabbitmqSubscription.prefetchCount
              },
              function(params) {
                let messageParams = {};
                try {
                  messageParams = JSON.parse(params);
                } catch (err) {
                  logger.error('--------Parsing failed--------------params-----', params);
                  return Promise.resolve({});
                }

                return oThis
                  ._sequentialExecutor(messageParams)
                  .then(
                    function(response) {
                      if (response.isFailure()) {
                        return Promise.resolve({});
                      }

                      return rabbitmqSubscription.promiseQueueManager.createPromise(messageParams);
                    },
                    function(err) {
                      logger.error('---------------------reject err------', err.toString());
                      return Promise.resolve({});
                    }
                  )
                  .catch(function(error) {
                    logger.error('Error in execute transaction', error);
                    return Promise.resolve({});
                  });
              },
              function(consumerTag) {
                rabbitmqSubscription.setConsumerTag(consumerTag);
              }
            )
            .catch(function(error) {
              logger.error('Error in subscription', error);
              oThis._ostRmqError();
            });
        }
      }
    }
  }

  /**
   * This method executes the promises.
   *
   * @param onResolve
   * @param onReject
   * @param {String} messageParams
   *
   * @returns {*}
   *
   * @private
   */
  _promiseExecutor(onResolve, onReject, messageParams) {
    const oThis = this;

    oThis
      ._processMessage(messageParams)
      .then(function() {
        onResolve();
      })
      .catch(function(error) {
        logger.error('e_r_msb_2', 'Error in process message from rmq.', 'Error: ', error, 'Params: ', messageParams);
        onResolve();
      });
  }

  /**
   * ost rmp error
   *
   * @param err
   * @private
   */
  _ostRmqError(err) {
    logger.info('ostRmqError occurred.', err);
    process.emit('SIGINT');
  }

  /**
   * This function checks if there are any pending tasks left or not.
   *
   * @returns {Boolean}
   */
  _pendingTasksDone() {
    const oThis = this;

    for (let topic in oThis.subscriptionTopicToDataMap) {
      let rabbitmqSubscription = oThis.subscriptionTopicToDataMap[topic];

      if (!rabbitmqSubscription.promiseQueueManager) {
        continue;
      }

      let pendingTaskCount = rabbitmqSubscription.promiseQueueManager.getPendingCount();

      if (pendingTaskCount != 0) {
        logger.info('Waiting for pending tasks. Count:', pendingTaskCount);
        return false;
      }
    }

    return true;
  }

  /**
   * Stops consumption upon invocation
   */
  _stopPickingUpNewTasks() {
    const oThis = this;

    // stopping consumption for all the topics
    for (let topic in oThis.subscriptionTopicToDataMap) {
      let rabbitmqSubscription = oThis.subscriptionTopicToDataMap[topic];

      rabbitmqSubscription.stopConsumption();
    }
  }

  /**
   * Timeout in milli seconds
   *
   * @return {number}
   */
  get timeoutInMilliSecs() {
    return 3 * 60 * 1000; // By default the time out is 3 minutes
  }

  /**
   * Ack required
   *
   * @return {number}
   */
  get ackRequired() {
    return 1;
  }

  /**
   * Sequential executor
   * @param messageParams
   * @return {Promise<void>}
   * @private
   */

  async _sequentialExecutor(messageParams) {
    // Default behaviour - nothing to do.
    return responseHelper.successWithData({});
  }

  /**
   * On max zombie count reached
   *
   * @private
   */
  _onMaxZombieCountReached() {
    logger.warn('e_r_sb_1', 'maxZombieCount reached. Triggering SIGTERM.');
    // Trigger gracefully shutdown of process.
    process.kill(process.pid, 'SIGTERM');
  }

  /**
   * Prepare subscription data.
   *
   * @returns {{}}
   * @private
   */
  _prepareSubscriptionData() {
    const oThis = this;

    for (let i = 0; i < oThis.topics.length; i++) {
      let topic = oThis.topics[i],
        queueSuffix = oThis.queues[i];
      oThis.subscriptionTopicToDataMap[topic] = new RabbitmqSubscription({
        topic: topic,
        queue: 'bg_' + queueSuffix,
        prefetchCount: oThis.prefetchCount
      });
    }
  }

  /**
   * Cron kind
   *
   * @return {string}
   * @private
   */
  get _cronKind() {
    return cronProcessesConstant.bgJobRabbitmq;
  }

  /**
   * Process message
   *
   * @private
   */
  _processMessage() {
    throw '_processMessage sub class to implement.';
  }
}

module.exports = BgJobProcessorBase;
