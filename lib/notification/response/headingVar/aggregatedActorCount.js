const rootPrefix = '../../../..',
  HeadingVarBase = require(rootPrefix + '/lib/notification/response/headingVar/Base'),
  aggregatedNotificationsConstants = require(rootPrefix + '/lib/globalConstant/big/aggregatedNotifications'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

/**
 * Class for Actor Count heading var.
 *
 * @class ActorCount
 */
class ActorCount extends HeadingVarBase {
  /**
   * Perform for get template var data.
   *
   * @returns {object}
   */
  perform() {
    const oThis = this;

    return oThis.getVarData();
  }

  /**
   * Get data for entity.
   *
   * @returns {object}
   */
  getVarData() {
    const oThis = this;

    let maxCount = aggregatedNotificationsConstants.maxActorCount;

    let countStr =
      oThis.userNotification.actorCount > maxCount ? `${maxCount}+` : oThis.userNotification.actorCount.toString();

    return responseHelper.successWithData({
      replaceText: countStr
    });
  }
}

module.exports = ActorCount;
