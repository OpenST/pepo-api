const rootPrefix = '../..',
  CommonValidator = require(rootPrefix + '/lib/validators/Common'),
  gotoConstants = require(rootPrefix + '/lib/globalConstant/goto'),
  pageNameConstants = require(rootPrefix + '/lib/globalConstant/pageName'),
  GotoConfig = require(rootPrefix + '/lib/goTo/config');

class GoToFactory {
  constructor() {
    // Fetch config for GOTO
    const oThis = this;

    oThis.gotoConfig = GotoConfig;
  }

  /**
   * Get GoTo for given kind
   *
   * @param kind
   * @param values, eg: {uid: 1}
   * @returns {{pn: *, v: {}}}
   */
  gotoFor(kind, values) {
    const oThis = this;

    oThis._validateParams(kind, values);

    return oThis._replaceValuesFor(kind, values);
  }

  /**
   * Validate params for given kind
   *
   * @param kind
   * @param values
   * @private
   */
  _validateParams(kind, values) {
    const oThis = this;

    // Kind is missing
    if (CommonValidator.isVarNullOrUndefined(kind)) {
      throw 'Missing Goto kind';
    }

    // Goto kind is invalid.
    if (CommonValidator.isVarNullOrUndefined(oThis.gotoConfig[kind])) {
      throw 'Invalid Goto kind';
    }

    // Validate mandatory values for kind
    let mandatoryValues = oThis.gotoConfig[kind].values;
    if (mandatoryValues.length > 0) {
      if (!CommonValidator.validateNonEmptyObject(values)) {
        throw 'Invalid Goto values for kind: ' + kind;
      }

      for (let index = 0; index < mandatoryValues.length; index++) {
        let key = mandatoryValues[index];
        if (CommonValidator.isVarNullOrUndefined(values[key])) {
          throw 'Mandatory Goto values missing for kind: ' + kind;
        }
      }
    }
  }

  /**
   * Replace values with page parameters
   *
   * @param kind
   * @param params
   * @returns {{pn: *, v: {}}}
   * @private
   */
  _replaceValuesFor(kind, params) {
    const oThis = this;

    let gtConfig = oThis.gotoConfig[kind];

    let valuesMap = {};
    switch (kind) {
      case gotoConstants.videoGotoKind:
        valuesMap = { videoId: pageNameConstants.videoIdParam };
        break;
      case gotoConstants.signUpGotoKind:
        valuesMap = { inviteCode: pageNameConstants.inviteCodeParam };
        break;
      case gotoConstants.webViewGotoKind:
        valuesMap = { url: pageNameConstants.webViewUrlParam };
        break;
    }

    let goto = { pn: gtConfig.page, v: {} };
    if (CommonValidator.validateNonEmptyObject(valuesMap)) {
      for (let key in valuesMap) {
        let vm = valuesMap[key];
        goto.v[vm] = params[key];
      }
    }

    return goto;
  }
}

module.exports = new GoToFactory();
