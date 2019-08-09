const rootPrefix = '../../..',
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  headingVarFactory = require(rootPrefix + '/lib/notification/response/headingVar/factory'),
  imageVarFactory = require(rootPrefix + '/lib/notification/response/imageVar/factory'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  notificationResponseConfig = require(rootPrefix + '/lib/notification/config/response');

/**
 * Class to get short and long names of columns.
 *
 * @class ColumnName
 */
class NotificationResponseGet {
  /**
   * Get encrypt id for notification.
   *
   * @param {Object} params
   *
   * @returns {*}
   */
  static getEncryptIdForNotification(userNotification) {
    let idData = {
      user_id: userNotification.userId,
      last_action_timestamp: userNotification.lastActionTimestamp,
      uuid: userNotification.uuid
    };

    return basicHelper.encryptPageIdentifier(idData);
  }

  /**
   * Get image id for notification.
   *
   * @param {Object} params
   *
   * @returns {*}
   */
  static getImageIdForNotification(params) {
    const userNotification = params.userNotification,
      supportingEntities = params.supportingEntities,
      kind = userNotification.kind;

    const imageVar = NotificationResponseGet.imageNotificationConfigForKind(kind);

    const imageVarClass = imageVarFactory.getInstance(imageVar);

    let resp = new imageVarClass({
      userNotification: userNotification,
      supportingEntities: supportingEntities
    }).perform();

    if (resp.isFailure()) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_n_h_g_giifn_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { params }
        })
      );
    }

    return responseHelper.successWithData({ imageId: resp.data.imageId });
  }

  /**
   * Get goto for notification.
   *
   * @param {Object} params
   *
   * @returns {*}
   */
  static getGotoForNotification(params) {
    const userNotification = params.userNotification,
      kind = userNotification.kind;

    const gotoConfig = NotificationResponseGet.gotoNotificationConfigForKind(kind);
    let finalGoto = {
      pn: gotoConfig['pn'],
      v: {}
    };

    for (let internalKey in gotoConfig['v']) {
      let tableKeyName = gotoValueHash[internalKey];
      if (tableKeyName == 'actorId') {
        finalGoto['v'][internalKey] = userNotification['actorIds'][0];
      } else {
        finalGoto['v'][internalKey] = userNotification[tableKeyName];
      }
    }

    return responseHelper.successWithData(finalGoto);
  }

  /**
   * Get flattened object in a single level
   *
   * @param {Object} obj
   *
   * @returns {*}
   */
  static getFlattenedObject(obj) {
    let flattenedObj = obj;
    return flattenedObj;
  }

  /**
   * Get kind specific heading.
   *
   * @param {string} kind
   *
   * @returns {*}
   */
  static getHeadingForNotification(params) {
    const userNotification = params.userNotification,
      supportingEntities = params.supportingEntities,
      headingVersion = userNotification.headingVersion,
      kind = userNotification.kind;

    const headingConfig = NotificationResponseGet.headingNotificationConfigForKind(kind, headingVersion);

    const title = headingConfig['title'],
      headingVars = headingConfig['template_vars'];

    let includes = {};
    let replaceText = {};

    for (let i = 0; i < headingVars.length; i++) {
      const headingVar = headingVars[i];

      const headingVarClass = headingVarFactory.getInstance(headingVar);

      let resp = new headingVarClass({
        userNotification: userNotification,
        supportingEntities: supportingEntities
      }).perform();

      if (resp.isFailure()) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'l_n_h_g_ghfn_1',
            api_error_identifier: 'something_went_wrong',
            debug_options: { params }
          })
        );
      }

      replaceText[`{{${headingVar}}`] = Object.keys(resp.data)[0];
      includes = Object.assign(includes, resp.data);
    }

    var regex = [];
    for (var key in replaceText) {
      regex.push(key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
    }

    let formattedText = title.replace(new RegExp(regex.join('|'), 'g'), function(word) {
      return replaceText[word];
    });

    let finalResp = {
      heading: {
        text: formattedText,
        includes: includes
      }
    };

    return responseHelper.successWithData(finalResp);
  }

  /**
   * Get kind specific image config for notification.
   *
   * @param {string} kind
   *
   * @returns {*}
   */
  static imageNotificationConfigForKind(kind) {
    let config = NotificationResponseGet.notificationConfigForKind(kind);

    const imageConfig = config['image'];

    if (!imageConfig) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_n_h_g_incfk_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { kind: kind }
        })
      );
    }

    return imageConfig;
  }

  /**
   * Get kind specific payload config for notification.
   *
   * @param {string} kind
   *
   * @returns {*}
   */
  static payloadNotificationConfigForKind(kind) {
    let config = NotificationResponseGet.notificationConfigForKind(kind);

    const payloadConfig = config['payload'];

    if (!payloadConfig) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_n_h_g_pncfk_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { kind: kind }
        })
      );
    }

    return payloadConfig;
  }

  /**
   * Get kind specific payload config for notification.
   *
   * @param {string} kind
   *
   * @returns {*}
   */
  static getSupportingEntitiesConfigForKind(kind) {
    let config = NotificationResponseGet.notificationConfigForKind(kind);

    const supportingEntitiesConfig = config['supportingEntities'];

    if (!supportingEntitiesConfig) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_n_h_g_gsecfk_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { kind: kind }
        })
      );
    }

    return supportingEntitiesConfig;
  }

  /**
   * Get kind specific heading config for notification.
   *
   * @param {string} kind
   *
   * @returns {*}
   */
  static headingNotificationConfigForKind(kind, headingVersion) {
    let config = NotificationResponseGet.notificationConfigForKind(kind);

    const headingConfig = config['headings'][headingVersion];

    if (!headingConfig) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_n_h_g_hncfk_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { kind: kind, headingVersion: headingVersion }
        })
      );
    }

    return headingConfig;
  }

  /**
   * Get kind specific goto config for notification.
   *
   * @param {string} kind
   *
   * @returns {*}
   */
  static gotoNotificationConfigForKind(kind) {
    let config = NotificationResponseGet.notificationConfigForKind(kind);

    const gotoConfig = config['goto'];

    if (!gotoConfig) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_n_h_g_gncfk_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { kind: kind }
        })
      );
    }

    return gotoConfig;
  }

  /**
   * Get kind specific config for notification.
   *
   * @param {string} kind
   *
   * @returns {*}
   */
  static notificationConfigForKind(kind) {
    let config = notificationResponseConfig[kind];

    if (!config || !config['notification']) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'l_n_h_g_ncfk_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { kind: kind }
        })
      );
    }

    return config['notification'];
  }
}

module.exports = new NotificationResponseGet();
