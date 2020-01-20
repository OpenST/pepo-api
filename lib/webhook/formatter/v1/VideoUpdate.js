const uuidV4 = require('uuid/v4');

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
   * @returns {{data: {activity: {kind: string, actor_id: *, video: *}, users: *}, webhook_id: string, topic: string, created_at: *, id: *, version: string}}
   */
  perform(params) {
    const formattedUserData = new UserEntityFormatter(params).perform();
    const formattedVideoData = new VideoEntityFormatter(params).perform();

    const videoId = params.videoIds[0];
    const videoData = formattedVideoData[videoId];

    return {
      id: uuidV4(),
      topic: params.webhookEventKind,
      created_at: Date.now(),
      webhook_id: params.webhookEndpoint.uuid,
      version: 'v1',
      data: {
        users: formattedUserData,
        activity: {
          kind: webhookEventConstants.videoUpdateActivityKind,
          actor_id: videoData.creator_id,
          video: videoData
        }
      }
    };
  }
}

module.exports = VideoUpdate;
