const rootPrefix = '../../../..',
  UserEntityFormatter = require(rootPrefix + '/lib/webhook/formatter/v1/entities/User'),
  VideoEntityFormatter = require(rootPrefix + '/lib/webhook/formatter/v1/entities/Video');

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
   * @param {object} params.descriptionIdToTagIdsMap
   * @param {object} params.tags
   *
   * @returns {{data: {activity: {kind: *, actor_id: *, video: *}, users: *}, webhook_id: *, topic: *, created_at: *, id: *, version: *}}
   */
  perform(params) {
    const videoId = params.videoIds[0];
    const creatorUserId = params.videoDetails[videoId].creatorUserId;
    const actorId = creatorUserId;

    const formattedUserData = new UserEntityFormatter({
      userIds: [creatorUserId],
      users: params.users,
      images: params.images,
      tokenUsers: params.tokenUsers
    }).perform();

    const formattedVideoData = new VideoEntityFormatter({
      webhookEndpoint: params.webhookEndpoint,
      videoIds: [videoId],
      videos: params.videos,
      videoDetails: params.videoDetails,
      texts: params.texts,
      images: params.images,
      descriptionIdToTagIdsMap: params.descriptionIdToTagIdsMap,
      tags: params.tags
    }).perform();

    const videoData = formattedVideoData[videoId];

    return {
      id: params.webhookEvent.uuid,
      topic: params.webhookEventKind,
      created_at: params.webhookEvent.createdAt,
      webhook_id: params.webhookEndpoint.uuid,
      version: params.webhookEndpoint.apiVersion,
      data: {
        users: formattedUserData,
        activity: {
          kind: params.webhookEvent.topicKind,
          actor_id: Number(actorId),
          video: videoData
        }
      }
    };
  }
}

module.exports = new VideoUpdate();
