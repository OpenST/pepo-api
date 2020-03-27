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

  get pepoLiveEventChannelName() {
    if (basicHelper.isProduction()) {
      return 'pepo-live-event-monitoring';
    }

    return 'pepo-live-event-monitoring-test';
  }

  // Channel names end.

  /**
   * Add user info section for new video or reply.
   *
   * @param {object} userData
   * @param {object} twitterUserObj
   * @param {string} profileUrl
   * @param {boolean} isReply
   *
   * @returns {{text: {text: *, type: string}, type: string}}
   */
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
    message += `*Twitter handle:* ${twitterUserObj.handle || ''}\n`;
    message += `*Email address:* ${userData.email}\n`;

    return oThis.addTextSection(message);
  }

  /**
   * Add text section.
   *
   * @param {string} text
   *
   * @returns {{text: {text: *, type: string}, type: string}}
   */
  addTextSection(text) {
    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: text
      }
    };
  }

  /**
   * Add divider section.
   *
   * @returns {{type: string}}
   */
  get addDividerSection() {
    return {
      type: 'divider'
    };
  }

  /**
   * Add video link section.
   *
   * @param {string} text
   * @param {number} videoId
   *
   * @returns {{}}
   */
  addVideoLinkSection(text, videoId) {
    const oThis = this;

    const deleteVideoValue = `${oThis.deleteVideoEventType}|video_id:${videoId}`;

    return {
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
        value: deleteVideoValue,
        confirm: {
          title: {
            type: 'plain_text',
            text: 'Are you sure?'
          },
          text: {
            type: 'mrkdwn',
            text: 'Please confirm your action'
          },
          confirm: {
            type: 'plain_text',
            text: 'Delete Video'
          },
          deny: {
            type: 'plain_text',
            text: 'Cancel'
          }
        }
      }
    };
  }

  /**
   * Add reply link section.
   *
   * @param {string} text
   * @param {number} replyDetailId
   *
   * @returns {{}}
   */
  addReplyLinkSection(text, replyDetailId) {
    const oThis = this;

    const deleteReplyValue = `${oThis.deleteReplyEventType}|reply_detail_id:${replyDetailId}`;

    return {
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
        value: deleteReplyValue,
        confirm: {
          title: {
            type: 'plain_text',
            text: 'Are you sure?'
          },
          text: {
            type: 'mrkdwn',
            text: 'Please confirm your action'
          },
          confirm: {
            type: 'plain_text',
            text: 'Delete Reply'
          },
          deny: {
            type: 'plain_text',
            text: 'Cancel'
          }
        }
      }
    };
  }

  /**
   * Add user approval block section.
   *
   * @param {number} userId
   * @param {boolean} isDoubleOptInDone
   *
   * @returns {{elements: *, type: string}}
   */
  addApproveBlockSection(userId, isDoubleOptInDone) {
    const oThis = this;

    const elements = [oThis.approveUserElement(userId), oThis.deleteUserElement(userId)];

    if (isDoubleOptInDone) {
      elements.push(oThis.sendEmailForResubmissionElement(userId));
    }

    return {
      type: 'actions',
      elements: elements
    };
  }

  /**
   * Add user unmute block section.
   *
   * @param {number} userId
   * @param {boolean} isDoubleOptInDone
   *
   * @returns {{elements: *, type: string}}
   */
  addUnmuteBlockSection(userId, isDoubleOptInDone) {
    const oThis = this;

    const elements = [oThis.unmuteUserElememt(userId), oThis.deleteUserElement(userId)];

    if (isDoubleOptInDone) {
      elements.push(oThis.sendEmailForResubmissionElement(userId));
    }

    return {
      type: 'actions',
      elements: elements
    };
  }

  /**
   * Unmute user element.
   *
   * @param {number} userId
   *
   * @returns {{}}
   */
  unmuteUserElememt(userId) {
    const oThis = this;

    const unmuteUserValue = `${oThis.unmuteUserEventType}|user_id:${userId}`;

    return {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Unmute User',
        emoji: true
      },
      style: 'primary',
      value: unmuteUserValue,
      confirm: {
        title: {
          type: 'plain_text',
          text: 'Are you sure?'
        },
        text: {
          type: 'mrkdwn',
          text: 'Please confirm your action'
        },
        confirm: {
          type: 'plain_text',
          text: 'Unmute User'
        },
        deny: {
          type: 'plain_text',
          text: 'Cancel'
        }
      }
    };
  }

  /**
   * Approve user element.
   *
   * @param {number} userId
   *
   * @returns {{}}
   */
  approveUserElement(userId) {
    const oThis = this;

    const approveUserValue = `${oThis.approveUserEventType}|user_id:${userId}`;

    return {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Approve User',
        emoji: true
      },
      style: 'primary',
      value: approveUserValue,
      confirm: {
        title: {
          type: 'plain_text',
          text: 'Are you sure?'
        },
        text: {
          type: 'mrkdwn',
          text: 'Please confirm your action'
        },
        confirm: {
          type: 'plain_text',
          text: 'Approve User'
        },
        deny: {
          type: 'plain_text',
          text: 'Cancel'
        }
      }
    };
  }

  /**
   * Delete user element.
   *
   * @param {number} userId
   *
   * @returns {{}}
   */
  deleteUserElement(userId) {
    const oThis = this;

    const deleteUserValue = `${oThis.deleteUserEventType}|user_id:${userId}`;

    return {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Delete User',
        emoji: true
      },
      style: 'danger',
      value: deleteUserValue,
      confirm: {
        title: {
          type: 'plain_text',
          text: 'Are you sure?'
        },
        text: {
          type: 'mrkdwn',
          text: 'Please confirm your action'
        },
        confirm: {
          type: 'plain_text',
          text: 'Delete User'
        },
        deny: {
          type: 'plain_text',
          text: 'Cancel'
        }
      }
    };
  }

  /**
   * Send email for resubmission element.
   *
   * @param {number} userId
   *
   * @returns {{}}
   */
  sendEmailForResubmissionElement(userId) {
    const oThis = this;

    const sendEmailValue = `${oThis.sendEmailEventType}|user_id:${userId}`;

    return {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Send Email for resubmission',
        emoji: true
      },
      style: 'primary',
      value: sendEmailValue,
      confirm: {
        title: {
          type: 'plain_text',
          text: 'Are you sure?'
        },
        text: {
          type: 'mrkdwn',
          text: 'Please confirm your action'
        },
        confirm: {
          type: 'plain_text',
          text: 'Send Email for resubmission'
        },
        deny: {
          type: 'plain_text',
          text: 'Cancel'
        }
      }
    };
  }

  // Slack domain related constants start.
  get slackTeamDomain() {
    return 'ostdotcom';
  }

  get eventExpiryTimestamp() {
    if (basicHelper.isDevelopment()) {
      return 5 * 60 * 10000;
    }

    return 5 * 60;
  }
  // Slack domain related constants end.

  // Slack event types start.
  get approveUserEventType() {
    return 'approve_user';
  }

  get unmuteUserEventType() {
    return 'unmute_user';
  }

  get deleteUserEventType() {
    return 'block_user';
  }

  get sendEmailEventType() {
    return 'send_email';
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
      oThis.sendEmailEventType,
      oThis.deleteVideoEventType,
      oThis.deleteReplyEventType,
      oThis.unmuteUserEventType
    ];
  }
  // Slack event types end.
}

module.exports = new Slack();
