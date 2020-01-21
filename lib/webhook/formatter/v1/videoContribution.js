const rootPrefix = '../../../..',
  UserEntityFormatter = require(rootPrefix + '/lib/webhook/formatter/v1/entities/User'),
  VideoEntityFormatter = require(rootPrefix + '/lib/webhook/formatter/v1/entities/Video'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent');

/**
 * Class for webhook video contribution event formatter.
 *
 * @class VideoContribution
 */
class VideoContribution {
  /**
   * Main performer for class.
   *
   * @param {object} params
   * @param {string} params.webhookEventKind
   * @param {object} params.webhookEvent
   * @param {object} params.webhookEndpoint
   * @param {string} params.webhookEndpoint.uuid
   * @param {array<number>} params.videoIds
   * @param {object} params.videos
   * @param {object} params.videoDetails
   * @param {object} params.texts
   * @param {array<number>} params.userIds
   * @param {object} params.users
   * @param {object} params.tokenUsers
   * @param {object} params.images
   * @param {array<number>} params.transactionIds
   * @param {object} params.transactions
   *
   * @returns {{data: {activity: {kind: *, actor_id: *, video: *}, users: *}, webhook_id: *, topic: *, created_at: *, id: *, version: *}}
   */
  perform(params) {
    const transactionId = params.transactionIds[0];
    const videoId = params.videoIds[0];
    const actorId = params.transactions[transactionId].fromUserId;

    const formattedUserData = new UserEntityFormatter({
      userIds: params.userIds,
      users: params.users,
      images: params.images,
      tokenUsers: params.tokenUsers
    }).perform();

    const formattedVideoData = new VideoEntityFormatter({
      videoIds: [videoId],
      videos: params.videos,
      videoDetails: params.videoDetails,
      texts: params.texts,
      images: params.images
    }).perform();

    const videoData = formattedVideoData[videoId];

    return {
      id: params.webhookEvent.uuid,
      topic: params.webhookEventKind,
      created_at: Math.floor(Date.now() / 1000),
      webhook_id: params.webhookEndpoint.uuid,
      version: params.webhookEndpoint.apiVersion,
      data: {
        users: formattedUserData,
        activity: {
          kind: webhookEventConstants.videoUpdateContributionKind,
          actor_id: actorId,
          video: videoData
        }
      }
    };
  }
}

module.exports = new VideoContribution();
