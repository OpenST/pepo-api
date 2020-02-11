/**
 * Usage: node executables/oneTimers/webhooksSubscription.js
 *
 * @module executables/oneTimers/webhooksSubscription
 */

const rootPrefix = '../..',
  WebhooksModel = require(rootPrefix + '/app/models/mysql/Webhook'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper'),
  webhookConstants = require(rootPrefix + '/lib/globalConstant/webhooks');

/**
 * Class for Webhooks subscription.
 *
 * @class WebhooksSubscription
 */
class WebhooksSubscription {
  /**
   * Main performer for class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.subscribeToOstPlatformEvents();

    await oThis.seedWebhooksDataInTable();
  }

  /**
   * Function to subscribe for web hooks.
   *
   * @returns {Promise<never>}
   */
  async subscribeToOstPlatformEvents() {
    const oThis = this;

    const webhookUrl = webhookConstants.webhookUrl;
    const params = {
      topics: [
        'transactions/initiate',
        'transactions/success',
        'transactions/failure',
        'users/activation_initiate',
        'users/activation_success',
        'users/activation_failure',
        'price_points/usd_update',
        'price_points/eur_update',
        'price_points/gbp_update'
      ],
      url: webhookUrl,
      status: webhookConstants.active
    };

    logger.log('Created webhook for: ', params);

    const webhooksCreationResponse = await jsSdkWrapper.createWebhooks(params);

    if (webhooksCreationResponse.isFailure()) {
      logger.error(webhooksCreationResponse);

      return Promise.reject(webhooksCreationResponse);
    }

    const resultType = webhooksCreationResponse.data.result_type;

    oThis.webhooksData = webhooksCreationResponse.data[resultType];

    logger.step('OST webhook id: ', oThis.webhooksData.id);
  }

  /**
   * Function to seed webhooks table.
   *
   * @returns {Promise<never>}
   */
  async seedWebhooksDataInTable() {
    const oThis = this;

    const currentTime = Math.floor(Date.now() / 1000);

    // Insert in webhooks table.
    const insertResponse = await new WebhooksModel()
      .insert({
        ost_id: oThis.webhooksData.id,
        status: webhookConstants.invertedStatuses[oThis.webhooksData.status],
        created_at: currentTime,
        updated_at: currentTime
      })
      .fire();

    if (!insertResponse) {
      return Promise.reject(new Error('Error while inserting data in webhooks table.'));
    }
  }
}

new WebhooksSubscription()
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.error(JSON.stringify(err));
    process.exit(1);
  });
