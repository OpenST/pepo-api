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
      return 'pepo-approve-new-creators';
    }

    return 'test_approve_new_creators';
  }

  get contentMonitoringChannelName() {
    if (basicHelper.isProduction()) {
      return 'pepo-content-monitoring';
    }

    return 'test_content_monitoring';
  }
  // Channel names end.

  addUserInfoSection(userData, twitterUserObj, profileUrl, isReply) {
    const oThis = this;

    let InfoHeaderLine = null;
    if (isReply) {
      InfoHeaderLine =
        '*Hi, We got a reply from a User at PEPO. Please check the details about the videos and take actions accordingly*';
    } else {
      InfoHeaderLine =
        '*Hi, We got a video from a User at PEPO. Please check the details about the videos and take actions accordingly*';
    }

    let message = '';
    message += `${InfoHeaderLine}\n`;
    message += `*User's Full Name:* ${userData.name}\n`;
    message += `*Username:* ${userData.userName}\n`;
    message += `*Admin Profile URL:* ${profileUrl}\n`;
    message += `*Twitter handle:* ${twitterUserObj.handle}\n`;
    message += `*Email address:* ${userData.email}\n`;
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
    const oThis = this;

    let deleteVideoValue = `${oThis.deleteVideoEventType}|video_id:${videoId}`;

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

  addReplyLinkSection(text, replyDetailId) {
    const oThis = this;

    let deleteReplyValue = `${oThis.deleteReplyEventType}|reply_detail_id:${replyDetailId}`;

    let replyLinkSection = {
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
          text: 'Delete Reply'
        },
        style: 'danger',
        value: deleteReplyValue
      }
    };

    return replyLinkSection;
  }

  addApproveBlockSection(userId) {
    const oThis = this;

    let approveUserValue = `${oThis.approveUserEventType}|user_id:${userId}`,
      deleteUserValue = `${oThis.deleteUserEventType}|user_id:${userId}`;

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
            text: 'Delete User',
            emoji: true
          },
          style: 'danger',
          value: deleteUserValue
        }
      ]
    };

    return approveDenySection;
  }

  // slack domain related constants start

  get slackTeamDomain() {
    return 'ostdotcom';
  }

  get eventExpiryTimestamp() {
    if (basicHelper.isDevelopment()) {
      return 5 * 60 * 10000;
    }
    return 5 * 60;
  }

  // slack domain related constants end

  // slack event type start

  get approveUserEventType() {
    return 'approve_user';
  }

  get deleteUserEventType() {
    return 'block_user';
  }

  get deleteVideoEventType() {
    return 'delete_video';
  }

  get deleteReplyEventType() {
    return 'delete_reply';
  }

  get allowedEventTypes() {
    const oThis = this;
    return [
      oThis.approveUserEventType,
      oThis.deleteUserEventType,
      oThis.deleteVideoEventType,
      oThis.deleteReplyEventType
    ];
  }

  // slack event type end
}

module.exports = new Slack();
