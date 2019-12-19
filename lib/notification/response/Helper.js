const rootPrefix = '../../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageVarFactory = require(rootPrefix + '/lib/notification/response/imageVar/factory'),
  notificationCentreConfig = require(rootPrefix + '/lib/notification/config/notificationCentre'),
  pushNotificationConfig = require(rootPrefix + '/lib/pushNotification/responseConfig'),
  notificationHookConstants = require(rootPrefix + '/lib/globalConstant/notificationHook'),
  userNotificationConstants = require(rootPrefix + '/lib/globalConstant/cassandra/userNotification'),
  util = require(rootPrefix + '/lib/util'),
  gotoFactory = require(rootPrefix + '/lib/goTo/factory'),
  headingVarFactory = require(rootPrefix + '/lib/notification/response/headingVar/factory');

/**
 * Class to get short and long names of columns.
 *
 * @class NotificationHelper
 */
class NotificationHelper {
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
   * @param {object} params.notificationType
   * @param {string} params.kind
   *
   * @returns {result}
   */
  static getImageIdForNotification(params) {
    const userNotification = params.userNotification,
      supportingEntities = params.supportingEntities,
      notificationType = params.notificationType,
      kind = userNotification.kind;

    const imageVar = NotificationHelper.imageNotificationConfigForKind(kind, notificationType);

    if (!imageVar) {
      return responseHelper.successWithData({ imageId: null });
    }

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
          debug_options: params
        })
      );
    }

    return responseHelper.successWithData({ imageId: resp.data.imageId });
  }

  /**
   * Get Data Key from notification.
   *
   * @param userNotification
   * @param dataKeys
   * @returns {*}
   */
  static getKeyDataFromNotification(userNotification, dataKeys) {
    let val = userNotification;

    for (let index = 0; index < dataKeys.length; index++) {
      const dataKey = dataKeys[index];

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
      payloadConfig = NotificationHelper.payloadNotificationConfigForKind(kind, notificationType);

    for (const payloadKey in payloadConfig) {
      const payloadDataKeys = payloadConfig[payloadKey];
      payload[payloadKey] = NotificationHelper.getKeyDataFromNotification(userNotification, payloadDataKeys);
    }

    return responseHelper.successWithData({ payload: payload });
  }

  /**
   * Get goto for notification.
   *
   * @param {object} params
   * @param {object} params.userNotification
   * @param {object} params.notificationType
   * @param {string} params.kind
   *
   * @returns {*|result}
   */
  static getGotoForNotification(params) {
    const userNotification = params.userNotification,
      notificationType = params.notificationType,
      kind = userNotification.kind;

    let gotoConfigKind = null;

    let gotoParams = userNotification.gotoParams || {};

    if (CommonValidators.validateNonBlankString(gotoParams)) {
      gotoParams = JSON.parse(gotoParams);
      gotoConfigKind = gotoParams.kind;
      delete gotoParams.kind;
    } else {
      const gotoConfig = NotificationHelper.gotoNotificationConfigForKind(kind, notificationType);

      if (Object.keys(gotoConfig).length < 1) {
        return responseHelper.successWithData({});
      }

      gotoConfigKind = gotoConfig.kind;
      for (const gotoParam in gotoConfig.params) {
        const dataKeys = gotoConfig.params[gotoParam];
        gotoParams[gotoParam] = NotificationHelper.getKeyDataFromNotification(userNotification, dataKeys);
      }
    }

    const finalGoto = gotoFactory.gotoFor(gotoConfigKind, gotoParams);

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
    const flattenedObj = util.clone(obj);

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
   * @param {object} params.notificationType
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
      payload = params.payload,
      kind = userNotification.kind;

    const headingConfig = NotificationHelper.headingNotificationConfigForKind(kind, headingVersion, notificationType);

    const title = headingConfig.title,
      body = headingConfig.body,
      headingVars = headingConfig.templateVars;

    const includes = {};
    const replaceTextMap = {};

    for (let index = 0; index < headingVars.length; index++) {
      const headingVar = headingVars[index];

      const initParams = {
        userNotification: userNotification,
        supportingEntities: supportingEntities,
        payload: payload
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

      const replaceText = resp.data.replaceText;

      replaceTextMap[`{{${headingVar}}}`] = replaceText;

      if (resp.data.includes) {
        includes[replaceText] = resp.data.includes;
      }
    }

    const regex = [];
    for (const key in replaceTextMap) {
      regex.push(key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'));
    }

    let formattedText = body;

    if (!basicHelper.isEmptyObject(replaceTextMap)) {
      formattedText = body.replace(new RegExp(regex.join('|'), 'g'), function(word) {
        return replaceTextMap[word];
      });
    }

    const finalResp = {
      heading: {
        title: title || '',
        text: formattedText,
        includes: includes
      }
    };

    return responseHelper.successWithData(finalResp);
  }

  /**
   * Get kind specific image config for notification.
   *
   * @param kind
   * @param notificationType
   * @returns {*}
   */
  static imageNotificationConfigForKind(kind, notificationType) {
    const config = NotificationHelper.getConfigForKindAndNotificationType(kind, notificationType);

    const imageConfig = config.image;

    if (imageConfig == 'undefined') {
      throw new Error(`l_n_h_g_incfk_1: Invalid kind: ${kind} Invalid notificationType-${notificationType}`);
    }

    return imageConfig;
  }

  /**
   * Get kind specific payload config for notification.
   *
   * @param kind
   * @param notificationType
   * @returns {*}
   */
  static payloadNotificationConfigForKind(kind, notificationType) {
    const config = NotificationHelper.getConfigForKindAndNotificationType(kind, notificationType);

    const payloadConfig = config.payload;

    if (!payloadConfig) {
      throw new Error(`l_n_h_g_pncfk_1: Invalid kind-${kind} Invalid notificationType-${notificationType}`);
    }

    return payloadConfig;
  }

  /**
   * Get kind specific payload config for notification.
   *
   * @param kind
   * @param notificationType
   * @returns {*}
   */
  static getSupportingEntitiesConfigForKind(kind, notificationType) {
    const config = NotificationHelper.getConfigForKindAndNotificationType(kind, notificationType);

    const supportingEntitiesConfig = config.supportingEntities;

    if (!supportingEntitiesConfig) {
      throw new Error(`l_n_h_g_gsecfk_1: Invalid kind-${kind} Invalid notificationType-${notificationType}`);
    }

    return supportingEntitiesConfig;
  }

  /**
   * Get kind specific heading config for notification.
   *
   * @param kind
   * @param headingVersion
   * @param notificationType
   * @returns {*}
   */
  static headingNotificationConfigForKind(kind, headingVersion, notificationType) {
    const config = NotificationHelper.getConfigForKindAndNotificationType(kind, notificationType);

    const headingConfig = config.headings[headingVersion] || config.headings[1];

    if (!headingConfig) {
      throw new Error(
        `l_n_h_g_hncfk_1: Invalid kind-${kind}, headingVersion:${headingVersion} Invalid notificationType-${notificationType}`
      );
    }

    return headingConfig;
  }

  /**
   * Get kind specific goto config for notification.
   *
   * @param kind
   * @param notificationType
   * @returns {*}
   */
  static gotoNotificationConfigForKind(kind, notificationType) {
    const config = NotificationHelper.getConfigForKindAndNotificationType(kind, notificationType);

    const gotoConfig = config.goto;

    if (!gotoConfig) {
      throw new Error(`l_n_h_g_gncfk_1: Invalid kind-${kind} Invalid notificationType-${notificationType}`);
    }

    return gotoConfig;
  }

  /**
   * Get kind specific config for notification.
   *
   *
   * @param kind
   * @param notificationType
   * @returns {any}
   */
  static getConfigForKindAndNotificationType(kind, notificationType) {
    let configForKind = null;

    if (notificationType === userNotificationConstants.notificationCentreType) {
      configForKind = notificationCentreConfig[kind];
    } else if (notificationType === notificationHookConstants.pushNotificationType) {
      configForKind = pushNotificationConfig[kind];
    }

    if (!configForKind) {
      throw new Error(`l_n_h_g_ncfk_2: Invalid kind-${kind} Invalid notificationType-${notificationType}`);
    }

    return configForKind;
  }
}

module.exports = NotificationHelper;
