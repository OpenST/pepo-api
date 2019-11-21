const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  HttpLibrary = require(rootPrefix + '/lib/HttpRequest'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for slack related webhooks events base.
 *
 * @class SlackEventBase
 */
class SlackEventBase extends ServiceBase {
  /**
   * Constructor for slack related webhooks events base.
   *
   * @param {object} params
   * @param {object} params.eventDataPayload: event payload from slack
   * @param {object} params.eventParams: event params
   * @param {object} params.currentAdmin: current admin params
   *
   * @augments ServiceBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    const oThis = this;

    oThis.eventDataPayload = params.eventDataPayload;
    oThis.eventParams = params.eventParams;
    oThis.currentAdmin = params.currentAdmin;
  }

  /**
   * Validate param
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _validateAndSanitizeParams() {
    const oThis = this;

    logger.log('Validate for salck events factory');

    if (!oThis.eventParams || !CommonValidators.validateNonEmptyObject(oThis.eventParams)) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'a_s_se_b_1',
          api_error_identifier: 'something_went_wrong'
        })
      );
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Post request to slack
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _postRequestToSlack() {
    const oThis = this;
    logger.log('_postRequestToSlack start');

    const header = {
      'Content-Type': 'application/json'
    };

    let HttpLibObj = new HttpLibrary({
      resource: oThis.eventDataPayload.response_url,
      header: header,
      noFormattingRequired: true
    });

    const requestPayload = await oThis._getPayloadForSlackPost();
    const resp = await HttpLibObj.post(JSON.stringify(requestPayload));

    if (resp.isFailure()) {
      return Promise.reject(resp);
    }

    return Promise.resolve(responseHelper.successWithData({}));
  }

  /**
   * Get Payload for slack post request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _getPayloadForSlackPost() {
    const oThis = this;
    logger.log('_getPayloadForSlackPost start');

    let blocks = await oThis._newBlockForSlack();

    return {
      text: 'Your request was processed.',
      blocks: blocks
    };
  }

  /**
   * Constri Payload for slack post request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _newBlockForSlack() {
    const oThis = this;
    logger.log('_newBlockForSlack start');
    let actionPos = 0;

    const currentBlocks = oThis.eventDataPayload.message.blocks,
      actionBlockId = oThis.eventDataPayload.actions[0].block_id;

    for (let i = 0; i < currentBlocks.length; i++) {
      if (currentBlocks[i].block_id == actionBlockId) {
        actionPos = i;
      }
    }

    const newBlocks = JSON.parse(JSON.stringify(currentBlocks));

    return oThis._updatedBlocks(actionPos, newBlocks);
  }

  async _textToWrite(actionStr) {
    const oThis = this,
      currentTime = Math.round(new Date() / 1000),
      currentTimeStr = new Date().toUTCString();

    return `>*${actionStr} by <@${
      oThis.eventDataPayload.user.id
    }>* <!date^${currentTime}^{date_pretty} at {time}|${currentTimeStr}}>`;
  }

  /**
   * Update Payload for slack post request
   *
   *
   * @return {Promise<void>}
   *
   * @private
   */
  async _updatedBlocks(actionPos, currentBlocks) {
    throw new Error('Sub-class to implement.');
  }
}

module.exports = SlackEventBase;
