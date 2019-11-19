const rootPrefix = '../..',
  basicHelper = require(rootPrefix + '/helpers/basic');

/**
 * Class for slack constants.
 *
 * @class Slack
 */
class Slack {
  // Channel names start.
  get redemptionRequestChannelName() {
    if (basicHelper.isProduction()) {
      return 'pepo_redemption';
    }

    return 'test_pepo_redemption';
  }

  get approveNewCreatorsChannelName() {
    if (basicHelper.isProduction()) {
      return 'approve_new_creators';
    }

    return 'test_approve_new_creators';
  }

  get contentMonitoringChannelName() {
    if (basicHelper.isProduction()) {
      return 'content_monitoring';
    }

    return 'test_content_monitoring';
  }
  // Channel names end.

  addTextSection(text) {
    let textSection = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: text
      }
    };

    return textSection;
  }

  get addDividerSection() {
    let divider = {
      type: 'divider'
    };
    return divider;
  }

  addVideoLinkSection(text, videoId) {
    let deleteVideoValue = null;

    deleteVideoValue = `delete_video|video_id:${videoId}`;

    let videoLinkSection = {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: text
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          emoji: true,
          text: 'Delete Video'
        },
        style: 'danger',
        value: deleteVideoValue
      }
    };

    return videoLinkSection;
  }

  addApproveBlockSection(userId) {
    let approveUserValue = null,
      blockUserValue = null;

    approveUserValue = `approve_user|user_id:${userId}`;
    blockUserValue = `block_user|user_id:${userId}`;

    let approveDenySection = {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Approve User',
            emoji: true
          },
          style: 'primary',
          value: approveUserValue
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Block User',
            emoji: true
          },
          style: 'danger',
          value: blockUserValue
        }
      ]
    };

    return approveDenySection;
  }

  addDeleteVideoSection(videoId) {
    let deleteVideoValue = null;

    deleteVideoValue = `delete_video|video_id:${videoId}`;

    let deleteVideoSection = {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Delete Video',
            emoji: true
          },
          style: 'danger',
          value: deleteVideoValue
        }
      ]
    };

    return deleteVideoSection;
  }
}

module.exports = new Slack();
