const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  gotoConfig = require(rootPrefix + '/lib/goTo/config'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  pageNameConstants = require(rootPrefix + '/lib/globalConstant/pageName');

/**
 * Class for goto factory.
 *
 * @class GoToFactory
 */
class GoToFactory {
  /**
   * Constructor for goto factory.
   *
   * @constructor
   */
  constructor() {
    // Fetch config for GOTO.
    const oThis = this;

    oThis.gotoConfig = gotoConfig;
  }

  /**
   * Get goto for given kind.
   *
   * @param {string} kind
   * @param {object} values, eg: {uid: 1}
   *
   * @returns {{pn: *, v: {}}}
   */
  gotoFor(kind, values) {
    const oThis = this;

    oThis._validateParams(kind, values);

    return oThis._replaceValuesFor(kind, values);
  }

  /**
   * Validate params for given kind.
   *
   * @param {string} kind
   * @param {object} values
   *
   * @private
   */
  _validateParams(kind, values) {
    const oThis = this;

    // Kind is missing.
    if (CommonValidators.isVarNullOrUndefined(kind)) {
      throw new Error('Missing Goto kind');
    }

    // Goto kind is invalid.
    if (CommonValidators.isVarNullOrUndefined(oThis.gotoConfig[kind])) {
      throw new Error('Invalid Goto kind');
    }

    // Validate mandatory values for kind.
    const mandatoryValues = oThis.gotoConfig[kind].mandatoryValues;
    if (mandatoryValues.length > 0) {
      if (!CommonValidators.validateNonEmptyObject(values)) {
        throw new Error('Invalid Goto values for kind: ' + kind);
      }

      for (let index = 0; index < mandatoryValues.length; index++) {
        const key = mandatoryValues[index];
        if (CommonValidators.isVarNullOrUndefined(values[key])) {
          throw new Error('Mandatory Goto values missing for kind: ' + kind);
        }
      }
    }
  }

  /**
   * Replace values with page parameters.
   *
   * @param {string} kind
   * @param {object} params
   *
   * @returns {{pn: *, v: {}}}
   * @private
   */
  _replaceValuesFor(kind, params) {
    const oThis = this;

    const gtConfig = oThis.gotoConfig[kind];

    let valuesMap = {};
    switch (kind) {
      case gotoConstants.sessionAuthGotoKind:
        valuesMap = { sessionAuthPayloadId: pageNameConstants.sessionAuthPayloadIdParam };
        break;
      case gotoConstants.videoGotoKind:
        valuesMap = { videoId: pageNameConstants.videoIdParam };
        break;
      case gotoConstants.signUpGotoKind:
        valuesMap = { inviteCode: pageNameConstants.inviteCodeParam };
        break;
      case gotoConstants.webViewGotoKind:
        valuesMap = { url: pageNameConstants.webViewUrlParam };
        break;
      case gotoConstants.profileGotoKind:
        valuesMap = {
          userId: pageNameConstants.profileUserIdParam,
          [pageNameConstants.profileActionParam]: pageNameConstants.profileActionParam
        };
        break;
      case gotoConstants.contributedByGotoKind:
        valuesMap = { userId: pageNameConstants.profileUserIdParam };
        break;
      case gotoConstants.tagGotoKind:
        valuesMap = { tagId: pageNameConstants.tagIdParam };
        break;
      case gotoConstants.channelsGotoKind:
        valuesMap = { channelId: pageNameConstants.channelIdParam };
        break;
      case gotoConstants.replyGotoKind:
        valuesMap = {
          replyDetailId: pageNameConstants.replyDetailIdParam,
          parentVideoId: pageNameConstants.parentVideoIdParam
        };
        break;
      default: {
        // Do nothing.
      }
    }

    const goto = { pn: gtConfig.page, v: {} };
    if (CommonValidators.validateNonEmptyObject(valuesMap)) {
      for (const key in valuesMap) {
        const vm = valuesMap[key];
        goto.v[vm] = params[key];
      }
    }

    return goto;
  }
}

module.exports = new GoToFactory();
