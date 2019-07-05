const rootPrefix = '../../..',
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  coreConstants = require(rootPrefix + '/config/coreConstants'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetImageResolutions {
  /**
   * @constructor
   *
   * @param params
   * @param {number} params.userId - user id
   * @param {string} params.url - url
   * @param {object} params.resolutions - text to insert
   * @param {string} params.width - width fo the image
   * @param {string} params.height - height fo the image
   * @param {string} params.size - size fo the image
   */
  constructor(params) {
    const oThis = this;

    oThis.userId = Number(params.userId);
    oThis.url = params.url;
    oThis.resolutions = params.resolutions;
    oThis.width = params.width;
    oThis.height = params.height;
    oThis.size = params.size;

    oThis.resolution = {};
  }

  /**
   * Perform
   *
   * @return {Promise<void>}
   */
  async perform() {
    const oThis = this;
    if (typeof oThis.resolutions === 'object') {
      for (let key in oThis.resolutions) {
        let value = oThis.resolutions[key];
        if (!oThis.validateUrl(value.url)) {
          return responseHelper.paramValidationError({
            internal_error_identifier: 'l_u_i_gr_1',
            api_error_identifier: 'invalid_params',
            params_error_identifiers: 'invalid_user_id',
            debug_options: { url: value.url }
          });
        }
      }
      return oThis.resolutions;
    } else {
      oThis.validateUrl(oThis.url);
      oThis.resolution = {
        original: {
          url: oThis.url,
          width: oThis.width,
          height: oThis.height,
          size: oThis.size
        }
      };
      return oThis.resolution;
    }
  }

  /**
   * validate url
   *
   * return {boolean}
   */
  validateUrl(url) {
    const oThis = this;
    if (url == !undefined && url == !'') {
      let splitedUrl = url.split('images/');
      if (splitedUrl.length !== 2 || splitedUrl[0] !== coreConstants.S3_USER_ASSETS_FOLDER) {
        return false;
      }
      let fileName = splitedUrl[1];
      let splitedFile = fileName.split('-');
      if (splitedFile.length !== 3 || splitedFile[0] !== oThis.userId) {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }
}

module.exports = GetImageResolutions;
