const rootPrefix = '../../..',
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageVarFactory = require(rootPrefix + '/lib/notification/response/imageVar/factory'),
  notificationResponseConfig = require(rootPrefix + '/lib/notification/config/response'),
  util = require(rootPrefix + '/lib/util'),
  headingVarFactory = require(rootPrefix + '/lib/notification/response/headingVar/factory');

/**
 * Class to get short and long names of columns.
 *
 * @class NotificationResponseGet
 */
class NotificationResponseGet {
  /**
   * Get encrypt id for notification.
   *
   * @param {object} userNotification
   * @param {string/number} userNotification.userId
   * @param {string/number} userNotification.lastActionTimestamp
   * @param {string} userNotification.uuid
   *
   * @returns {*}
   */
  static getEncryptIdForNotification(userNotification) {
    const idData = {
      user_id: userNotification.userId,
      last_action_timestamp: userNotification.lastActionTimestamp,
      uuid: userNotification.uuid
    };

    return basicHelper.encryptPageIdentifier(idData);
  }

  /**
   * Get image id for notification.
   *
   * @param {object} params
   * @param {object} params.userNotification
   * @param {object} params.supportingEntities
   * @param {string} params.kind
   *
   * @returns {result}
   */
  static getImageIdForNotification(params) {
    const userNotification = params.userNotification,
      supportingEntities = params.supportingEntities,
      notificationType = params.notificationType,
      kind = userNotification.kind;

    const imageVar = NotificationResponseGet.imageNotificationConfigForKind(kind, notificationType);

    const initParams = {
      userNotification: userNotification,
      supportingEntities: supportingEntities
    };

    const imageVarObj = imageVarFactory.getInstance(imageVar, initParams);

    const resp = imageVarObj.perform();

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
   * Get Data Key from notification.
   *
   * @param {Object} params
   *
   * @returns {*}
   */
  static getKeyDataFromNotification(userNotification, dataKeys) {
    let val = userNotification;

    for (let i = 0; i < dataKeys.length; i++) {
      let dataKey = dataKeys[i];

      val = val[dataKey];
    }

    return val;
  }

  /**
   * Get payload for notification.
   *
   * @param {Object} params
   *
   * @returns {*}
   */
  static getPayloadDataForNotification(params) {
    const userNotification = params.userNotification,
      kind = userNotification.kind,
      notificationType = params.notificationType,
      payload = {},
      payloadConfig = NotificationResponseGet.payloadNotificationConfigForKind(kind, notificationType);

    for (const payloadKey in payloadConfig) {
      const payloadDataKeys = payloadConfig[payloadKey];
      payload[payloadKey] = NotificationResponseGet.getKeyDataFromNotification(userNotification, payloadDataKeys);
    }

    return responseHelper.successWithData({ payload: payload });
  }

  /**
   * Get goto for notification.
   *
   * @param {object} params
   * @param {object} params.userNotification
   * @param {string} params.kind
   *
   * @returns {*|result}
   */
  static getGotoForNotification(params) {
    const userNotification = params.userNotification,
      notificationType = params.notificationType,
      kind = userNotification.kind;

    const gotoConfig = NotificationResponseGet.gotoNotificationConfigForKind(kind, notificationType);
    const finalGoto = {
      pn: gotoConfig.pn,
      v: {}
    };

    for (let internalKey in gotoConfig['v']) {
      let dataKeys = gotoConfig['v'][internalKey];
      finalGoto['v'][internalKey] = NotificationResponseGet.getKeyDataFromNotification(userNotification, dataKeys);
    }

    return responseHelper.successWithData(finalGoto);
  }

  /**
   * Get flattened object in a single level for 2 level objects.
   *
   * NOTE: flattenedObject will contain the original data + extra keys which were wrapped inside other key
   *
   * @param {object} obj
   *
   * @returns {*}
   */
  static getFlattenedObject(obj) {
    let flattenedObj = util.clone(obj);

    for (const key in obj) {
      flattenedObj[key] = obj[key];
      if (typeof obj[key] === 'object') {
        for (const innerKey in obj[key]) {
          flattenedObj[innerKey] = obj[key][innerKey];
        }
      }
    }

    return flattenedObj;
  }

  /**
   * Get kind specific heading.
   *
   * @param {object} params
   * @param {object} params.userNotification
   * @param {object} params.supportingEntities
   * @param {string/number} params.headingVersion
   * @param {string} params.kind
   *
   * @returns {*}
   */
  static getHeadingForNotification(params) {
    const userNotification = params.userNotification,
      supportingEntities = params.supportingEntities,
      headingVersion = userNotification.headingVersion,
      notificationType = params.notificationType,
      kind = userNotification.kind;

    const headingConfig = NotificationResponseGet.headingNotificationConfigForKind(
      kind,
      headingVersion,
      notificationType
    );

    const title = headingConfig.title,
      headingVars = headingConfig.templateVars;

    let includes = {};
    const replaceText = {};

    for (let index = 0; index < headingVars.length; index++) {
      const headingVar = headingVars[index];

      const initParams = {
        userNotification: userNotification,
        supportingEntities: supportingEntities
      };

      const headingVarObj = headingVarFactory.getInstance(headingVar, initParams);

      const resp = headingVarObj.perform();

      if (resp.isFailure()) {
        return responseHelper.error({
          internal_error_identifier: 'l_n_h_g_ghfn_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { params, resp: resp }
        });
      }

      replaceText[`{{${headingVar}}}`] = Object.keys(resp.data)[0];
      includes = Object.assign(includes, resp.data);
    }

    const regex = [];
    for (const key in replaceText) {
      regex.push(key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
    }

    const formattedText = title.replace(new RegExp(regex.join('|'), 'g'), function(word) {
      return replaceText[word];
    });

    const finalResp = {
      heading: {
        text: formattedText,
        includes: includes
      }
    };

    return responseHelper.successWithData(finalResp);
  }

  /**
   * Get kind specific heading.
   *
   * @param {object} params
   * @param {object} params.userNotification
   * @param {object} params.supportingEntities
   * @param {string/number} params.headingVersion
   * @param {string} params.notificationType
   * @param {string} params.kind
   *
   * @returns {*}
   */
  static getHeadingForPushNotification(params) {
    const userNotification = params.userNotification,
      supportingEntities = params.supportingEntities,
      headingVersion = userNotification.headingVersion,
      notificationType = params.notificationType,
      kind = userNotification.kind;

    const headingConfig = NotificationResponseGet.headingNotificationConfigForKind(
      kind,
      headingVersion,
      notificationType
    );

    console.log('headingConfig---', headingConfig);

    const title = headingConfig.title,
      headingVars = headingConfig.templateVars;

    let includes = {};
    const replaceText = {};

    for (let index = 0; index < headingVars.length; index++) {
      const headingVar = headingVars[index];

      const initParams = {
        userNotification: userNotification,
        supportingEntities: supportingEntities
      };

      console.log('initParams---', initParams);

      const headingVarObj = headingVarFactory.getInstance(headingVar, initParams);

      const resp = headingVarObj.perform();

      if (resp.isFailure()) {
        return responseHelper.error({
          internal_error_identifier: 'l_n_h_g_ghfn_1',
          api_error_identifier: 'something_went_wrong',
          debug_options: { params, resp: resp }
        });
      }

      replaceText[`{{${headingVar}}}`] = Object.keys(resp.data)[0];
      //includes = Object.assign(includes, resp.data);
    }

    const regex = [];
    for (const key in replaceText) {
      regex.push(key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
    }

    const formattedText = title.replace(new RegExp(regex.join('|'), 'g'), function(word) {
      return replaceText[word];
    });

    const finalResp = {
      heading: {
        title: formattedText,
        body: includes
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
  static imageNotificationConfigForKind(kind, notificationType) {
    const config = NotificationResponseGet.notificationCentreConfigForKind(kind, notificationType);

    const imageConfig = config.image;

    if (!imageConfig) {
      throw new Error(`l_n_h_g_incfk_1: Invalid kind: ${kind} Invalid notificationType-${notificationType}`);
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
  static payloadNotificationConfigForKind(kind, notificationType) {
    const config = NotificationResponseGet.notificationCentreConfigForKind(kind, notificationType);

    const payloadConfig = config.payload;

    if (!payloadConfig) {
      throw new Error(`l_n_h_g_pncfk_1: Invalid kind-${kind} Invalid notificationType-${notificationType}`);
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
  static getSupportingEntitiesConfigForKind(kind, notificationType) {
    const config = NotificationResponseGet.notificationCentreConfigForKind(kind, notificationType);

    const supportingEntitiesConfig = config.supportingEntities;

    if (!supportingEntitiesConfig) {
      throw new Error(`l_n_h_g_gsecfk_1: Invalid kind-${kind} Invalid notificationType-${notificationType}`);
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
  static headingNotificationConfigForKind(kind, headingVersion, notificationType) {
    let headingConfig = {},
      config = NotificationResponseGet.notificationCentreConfigForKind(kind, notificationType);

    if (notificationType == 'notificationCentre') {
      headingConfig = config.headings[headingVersion];
    } else {
      headingConfig = config.heading;
    }

    if (!headingConfig) {
      throw new Error(
        `l_n_h_g_hncfk_1: Invalid kind-${kind}, headingVersion:${headingVersion} Invalid notificationType-${notificationType}`
      );
    }

    console.log('headingConfig---', headingConfig);

    return headingConfig;
  }

  /**
   * Get kind specific goto config for notification.
   *
   * @param {string} kind
   *
   * @returns {*}
   */
  static gotoNotificationConfigForKind(kind, notificationType) {
    const config = NotificationResponseGet.notificationCentreConfigForKind(kind, notificationType);

    const gotoConfig = config.goto;

    if (!gotoConfig) {
      throw new Error(`l_n_h_g_gncfk_1: Invalid kind-${kind} Invalid notificationType-${notificationType}`);
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
  static notificationCentreConfigForKind(kind, notificationType) {
    const config = notificationResponseConfig[kind];

    if (!config || !config[notificationType]) {
      throw new Error(`l_n_h_g_ncfk_2: Invalid kind-${kind} Invalid notificationType-${notificationType}`);
    }

    console.log('config----', config, notificationType, kind);

    let defaultConfig = JSON.parse(JSON.stringify(config['default']));

    let mergedConfig = Object.assign(defaultConfig, config[notificationType]);
    return mergedConfig;
  }
}

module.exports = NotificationResponseGet;
