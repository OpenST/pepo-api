const rootPrefix = '../../../..',
  UserEntityFormatter = require(rootPrefix + '/lib/webhook/formatter/v1/entities/User'),
  VideoEntityFormatter = require(rootPrefix + '/lib/webhook/formatter/v1/entities/Video'),
  webhookEventConstants = require(rootPrefix + '/lib/globalConstant/webhook/webhookEvent');

/**
 * Class for webhook video update event formatter.
 *
 * @class VideoUpdate
 */
class VideoUpdate {
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
   *
   * @returns {{data: {activity: {kind: *, actor_id: *, video: *}, users: *}, webhook_id: *, topic: *, created_at: *, id: *, version: *}}
   */
  perform(params) {
    const videoId = params.videoIds[0];
    const creatorUserId = params.videoDetails[videoId].creatorUserId;

    const formattedUserData = new UserEntityFormatter({
      userIds: [creatorUserId],
      users: params.users,
      images: params.images,
      tokenUsers: params.tokenUsers
    }).perform();

    const formattedVideoData = new VideoEntityFormatter({
      videoIds: [videoId],
      videos: params.videos,
      videoDetails: params.videoDetails,
      texts: params.texts
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
          kind: webhookEventConstants.videoUpdateActivityKind,
          actor_id: creatorUserId,
          video: videoData
        }
      }
    };
  }
}

module.exports = new VideoUpdate();
