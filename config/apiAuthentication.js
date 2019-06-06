'use strict';

const rootPrefix = '..',
  apiName = require(rootPrefix + '/lib/globalConstant/apiName');

let getRequestConfigData, getRequestRegexes, postRequestConfigData, postRequestRegexes;

class ApiAuthentication {
  /**
   * Get requests regexes & config
   * @return {Array}
   */
  get getRequestsDataExtractionRegex() {
    const oThis = this;
    if (getRequestRegexes) {
      return getRequestRegexes;
    }
    getRequestRegexes = oThis._dataExtractionRegexGenerator(oThis._getRequestConfig);

    return getRequestRegexes;
  }

  /**
   * Post requests regexes & config
   * @return {Array}
   */
  get postRequestsDataExtractionRegex() {
    const oThis = this;
    if (postRequestRegexes) {
      return postRequestRegexes;
    }
    postRequestRegexes = oThis._dataExtractionRegexGenerator(oThis._postRequestConfig);

    return postRequestRegexes;
  }

  get _getRequestConfig() {
    if (getRequestConfigData) {
      return getRequestConfigData;
    }

    getRequestConfigData = [
      {
        apiName: apiName.signUp,
        route: '/sign-up/'
      },
      {
        apiName: apiName.login,
        route: '/login/'
      }
      // Note: - Urls should end with a slash. Add config above this.
    ];

    return getRequestConfigData;
  }

  get _postRequestConfig() {
    if (postRequestConfigData) {
      return postRequestConfigData;
    }
    postRequestConfigData = [
      {
        apiName: apiName.signUp,
        route: '/sign-up/'
      },
      {
        apiName: apiName.login,
        route: '/login/'
      }
      // Note: - Urls should end with a slash. Add config above this.
    ];

    return postRequestConfigData;
  }

  /**
   *
   * From the config passed create data which would be used for regex matches later
   *
   * @param globalConfig
   * @return {Array}
   */
  _dataExtractionRegexGenerator(globalConfig) {
    let config, buffer;
    const regexes = [];

    for (let apiIndex = 0; apiIndex < globalConfig.length; apiIndex++) {
      config = globalConfig[apiIndex];

      buffer = {
        apiName: config.apiName,
        url: config.route,
        regExMatches: ['url'],
        regExUrl: '^' + config.route + '$'
      };

      const dynamicVariables = config.route.match(RegExp(':([^/]+)', 'gi')) || [];

      for (let index = 0; index < dynamicVariables.length; index++) {
        buffer.regExMatches.push(dynamicVariables[index].replace(':', ''));
        buffer.regExUrl = buffer.regExUrl.replace(dynamicVariables[index], '([^/]+)');
      }

      buffer.regExUrl = new RegExp(buffer.regExUrl, 'i');

      regexes.push(buffer);
    }

    return regexes;
  }
}

module.exports = new ApiAuthentication();
