/**
 * Usage: node executables/oneTimers/updateWebhookSubscriptions.js --webhooksId "__ABCD"
 *
 * @module executables/oneTimers/updateWebhookSubscriptions
 */

const program = require('commander');

const rootPrefix = '../..',
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  webhookConstants = require(rootPrefix + '/lib/globalConstant/webhooks');

program.option('--webhooksId <webhooksId>', 'Webhooks Id').parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log('    node executables/oneTimers/updateWebhookSubscriptions.js --webhooksId "__ABCD"');
  logger.log('');
  logger.log('');
});

if (!program.webhooksId) {
  program.help();
  process.exit(1);
}

/**
 * Class for UpdateWebhookSubscriptions
 *
 * @class
 */
class UpdateWebhookSubscriptions {
  /**
   * Constructor for UpdateWebhookSubscriptions
   *
   * @constructor
   */
  constructor(params) {
    const oThis = this;

    oThis.webhooksId = params.webhooksId;
  }

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.updateSubscriptionToOstPlatformEvents();
  }

  /**
   * Function to update subscription for web hooks.
   *
   * @returns {Promise<never>}
   */
  async updateSubscriptionToOstPlatformEvents() {
    const oThis = this;

    const webhookId = oThis.webhooksId,
      topics = [
        'transactions/success',
        'transactions/failure',
        'users/activation_initiate',
        'users/activation_success',
        'users/activation_failure',
        'price_points/usd_update',
        'price_points/eur_update',
        'price_points/gbp_update'
      ];

    const params = {
      webhook_id: webhookId,
      topics: topics,
      status: webhookConstants.active
    };

    logger.log('Created webhook for: ', params);

    let webhooksCreationResponse = await jsSdkWrapper.updateWebhooks(params);

    if (webhooksCreationResponse.isFailure()) {
      logger.error(webhooksCreationResponse);

      return Promise.reject(webhooksCreationResponse);
    }

    let resultType = webhooksCreationResponse.data.result_type;

    oThis.webhooksData = webhooksCreationResponse.data[resultType];

    logger.step('OST webhook id:', oThis.webhooksData.id);
  }
}

new UpdateWebhookSubscriptions({
  webhooksId: program.webhooksId
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(JSON.stringify(err));
    process.exit(1);
  });
