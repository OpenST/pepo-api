const rootPrefix = '../../../..',
  BaseFormatter = require(rootPrefix + '/lib/formatter/Base'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for reply details formatter.
 *
 * @class ReplyDetailSingleFormatter
 */
class ReplyDetailSingleFormatter extends BaseFormatter {
  /**
   * Constructor for reply details formatter.
   *
   * @param {object} params
   * @param {object} params.replyDetail
   *
   * @param {number} params.replyDetail.id
   * @param {object} params.replyDetail.creatorUserId
   * @param {string} params.replyDetail.entityKind
   * @param {number} params.replyDetail.entityId
   * @param {number} params.replyDetail.descriptionId
   * @param {array} params.replyDetail.linkIds
   * @param {number} params.replyDetail.totalContributedBy
   * @param {string} params.videoDetail.totalAmount
   * @param {number} params.replyDetail.totalTransactions
   * @param {number} params.replyDetail.parentId
   * @param {string} params.replyDetail.parentKind
   * @param {number} params.replyDetail.createdAt
   * @param {number} params.replyDetail.updatedAt
   *
   * @augments BaseFormatter
   *
   * @constructor
   */
  constructor(params) {
    super();

    const oThis = this;

    oThis.replyDetail = params.replyDetail;
  }

  /**
   * Validate the input objects.
   *
   * @returns {result}
   * @private
   */
  _validate() {
    const oThis = this;

    const replyDetailKeyConfig = {
      id: { isNullAllowed: false },
      creatorUserId: { isNullAllowed: true },
      entityKind: { isNullAllowed: false },
      entityId: { isNullAllowed: false },
      descriptionId: { isNullAllowed: true },
      linkIds: { isNullAllowed: true },
      parentId: { isNullAllowed: false },
      parentKind: { isNullAllowed: false },
      status: { isNullAllowed: false },
      createdAt: { isNullAllowed: false },
      updatedAt: { isNullAllowed: false }
    };

    return oThis.validateParameters(oThis.replyDetail, replyDetailKeyConfig);
  }

  /**
   * Format the input object.
   *
   * @returns {*|result|*}
   * @private
   */
  _format() {
    const oThis = this;

    return responseHelper.successWithData({
      id: Number(oThis.replyDetail.id),
      creator_user_id: Number(oThis.replyDetail.creatorUserId),
      entity_kind: oThis.replyDetail.entityKind,
      entity_id: Number(oThis.replyDetail.entityId),
      description_id: Number(oThis.replyDetail.descriptionId) || null,
      link_ids: oThis.replyDetail.linkIds,
      total_contributed_by: oThis.replyDetail.totalContributedBy || 0,
      total_amount_raised_in_wei: oThis.replyDetail.totalAmount || 0,
      total_transactions: oThis.replyDetail.totalTransactions || 0,
      parent_id: Number(oThis.replyDetail.parentId),
      parent_kind: oThis.replyDetail.parentKind,
      status: oThis.replyDetail.status,
      cts: Number(oThis.replyDetail.createdAt || 0),
      uts: Number(oThis.replyDetail.updatedAt || 0)
    });
  }
}

module.exports = ReplyDetailSingleFormatter;
