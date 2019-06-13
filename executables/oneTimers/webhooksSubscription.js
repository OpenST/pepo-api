/**
 * Usage: node executables/oneTimers/webhooksSubscription.js
 *
 * @module executables/oneTimers/webhooksSubscription
 */

const rootPrefix = '../..',
  WebhooksModel = require(rootPrefix + '/app/models/mysql/Webhook'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  webhookConstants = require(rootPrefix + '/lib/globalConstant/webhooks'),
  jsSdkWrapper = require(rootPrefix + '/lib/ostPlatform/jsSdkWrapper');

/**
 * Class for WebhooksSubscription
 *
 * @class
 */
class WebhooksSubscription {
  /**
   * Constructor for WebhooksSubscription
   *
   * @constructor
   */
  constructor() {}

  /**
   * Perform
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis.subscribeToOstPlatformEvents();

    await oThis.seedWebhooksDataInTable();
  }

  /**
   * Function to subscribe for web hooks
   *
   * @returns {Promise<never>}
   */
  async subscribeToOstPlatformEvents() {
    const oThis = this;

    let webhookUrl = webhookConstants.webhookUrl;
    let params = {
      topics: [
        'transactions/success',
        'transactions/failure',
        'users/activation_initiate',
        'users/activation_success',
        'users/activation_failure'
      ],
      url: webhookUrl,
      status: webhookConstants.active
    };

    logger.log('Created webhook for: ', params);

    let webhooksCreationResponse = await jsSdkWrapper.createWebhooks(params);

    if (webhooksCreationResponse.isFailure()) {
      logger.error(webhooksCreationResponse);
      return Promise.reject(webhooksCreationResponse);
    }

    let resultType = webhooksCreationResponse.data['result_type'];

    oThis.webhooksData = webhooksCreationResponse.data[resultType];

    logger.step('OST webhook id:', oThis.webhooksData.id);
  }

  /**
   * Function to seed webhooks table
   *
   * @returns {Promise<never>}
   */
  async seedWebhooksDataInTable() {
    const oThis = this;

    // Insert user in database
    let insertResponse = await new WebhooksModel()
      .insert({
        ost_id: oThis.webhooksData.id,
        status: webhookConstants.invertedStatuses[oThis.webhooksData.status],
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000
      })
      .fire();

    if (!insertResponse) {
      logger.error('Error while inserting data in webhooks table');
      return Promise.reject(new Error('Error while inserting data in webhooks table'));
    }
  }
}

new WebhooksSubscription()
  .perform()
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    console.log(JSON.stringify(err));
    process.exit(1);
  });
