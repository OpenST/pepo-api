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

  addUserInfoSection(userData, twitterUserObj, profileUrl) {
    const oThis = this;

    let message = '---------------------------------------------------------\n';
    message += `*Hi, We got a video from an existing User at PEPO. Please check the details about the videos and take actions accordingly*\n`;
    message += `*User's Full Name:*: ${userData.name}\n`;
    message += `*Username:*: ${userData.userName}\n`;
    message += `*Admin Profile URL:*: ${profileUrl}\n`;
    message += `*Twitter handle:*: ${twitterUserObj.handle}\n`;
    message += `*Email address:*: ${userData.email}\n`;
    return oThis.addTextSection(message);
  }

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
}

module.exports = new Slack();
