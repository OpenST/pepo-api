/**
 * This is library for saving and validating image urls
 *
 * @module lib/ImageLib
 */
const rootPrefix = '..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  bgJob = require(rootPrefix + '/lib/rabbitMqEnqueue/bgJob'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  bgJobConstants = require(rootPrefix + '/lib/globalConstant/bgJob'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs');

/**
 * Class to validate and shorten image urls.
 *
 * @class ImageLib
 */
class ImageLib {
  /**
   * Method to validate image object.
   *
   * @param {object} params
   * @param {string} params.imageUrl
   * @param {string} params.kind
   * @param {number} [params.userId]
   * @param {number} [params.channelId]
   * @param {boolean} params.enqueueResizer
   * @param {boolean} params.isExternalUrl
   * @param {number} [params.size]
   * @param {number} [params.width]
   * @param {number} [params.height]
   *
   * @returns {result}
   */
  validateImageObj(params) {
    const oThis = this;

    if (
      !CommonValidators.validateInteger(params.size || 0) ||
      !CommonValidators.validateInteger(params.width || 0) ||
      !CommonValidators.validateInteger(params.height || 0)
    ) {
      // Return error.
      return responseHelper.paramValidationError({
        internal_error_identifier: 'lib_il_1',
        api_error_identifier: 'invalid_api_params',
        params_error_identifiers: 'invalid_resolution',
        debug_options: { params: params }
      });
    }

    const resp = oThis.shortenUrl(params);
    if (resp.isFailure()) {
      return resp;
    }

    const response = {
      original: {
        url: resp.data.shortUrl,
        size: params.size,
        height: params.height,
        width: params.width
      }
    };

    return responseHelper.successWithData({ image: response });
  }

  /**
   * Method to validate image and save it.
   *
   * @param {object} params
   * @param {string} params.imageUrl
   * @param {string} params.kind
   * @param {number} [params.userId]
   * @param {number} [params.channelId]
   * @param {boolean} params.enqueueResizer
   * @param {boolean} params.isExternalUrl
   * @param {number} [params.size]
   * @param {number} [params.width]
   * @param {number} [params.height]
   *
   * @returns {Promise<result>}
   */
  async validateAndSave(params) {
    const oThis = this;

    const resp = oThis.validateImageObj(params);
    if (resp.isFailure()) {
      return resp;
    }

    const imageObject = resp.data.image;

    const insertParams = {
      resolutions: imageObject,
      kind: params.kind,
      resizeStatus: imageConstants.notResized
    };

    const imageRow = await new ImageModel().insertImage(insertParams);

    if (params.enqueueResizer) {
      await bgJob.enqueue(bgJobConstants.imageResizer, { userId: params.userId, imageId: imageRow.insertId });
    }

    return responseHelper.successWithData({ image: imageObject, insertId: imageRow.insertId });
  }

  /**
   * Shorten url from the full length url.
   *
   * @param {object} params
   * @param {string} params.imageUrl
   * @param {string} params.kind
   * @param {number} [params.userId]
   * @param {number} [params.channelId]
   * @param {boolean} params.enqueueResizer
   * @param {boolean} params.isExternalUrl
   * @param {number} [params.size]
   * @param {number} [params.width]
   * @param {number} [params.height]
   *
   * @returns {Result}
   */
  shortenUrl(params) {
    const oThis = this;

    let shortUrl = params.imageUrl;
    // If false, means url needs to be validate as per our internal url requirement.
    if (params.isExternalUrl) {
      shortUrl = oThis._shortenExternalUrl(params.imageUrl);

      // If url was not shortened, then just send an error email.
      if (shortUrl.length === params.imageUrl.length) {
        const errorObject = responseHelper.error({
          internal_error_identifier: 'lib_il_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            imageUrl: params.imageUrl
          }
        });

        createErrorLogsEntry.perform(errorObject, errorLogsConstants.mediumSeverity);
      }
    } else {
      const splitUrlArray = params.imageUrl.split('/'),
        fileName = splitUrlArray.pop(),
        baseUrl = splitUrlArray.join('/'),
        shortEntity = s3Constants.LongUrlToShortUrlMap[baseUrl];

      if (
        CommonValidators.isVarNullOrUndefined(fileName) ||
        CommonValidators.isVarNullOrUndefined(s3Constants.LongUrlToShortUrlMap[baseUrl]) ||
        !fileName.match(params.userId + '-')
      ) {
        return responseHelper.error({
          internal_error_identifier: 'lib_il_2',
          api_error_identifier: 'invalid_url',
          debug_options: {
            splittedUrlArray: splitUrlArray,
            fileName: fileName,
            baseUrl: baseUrl,
            shortEntity: shortEntity
          }
        });
      }

      shortUrl = shortEntity + '/' + fileName;
    }

    return responseHelper.successWithData({ shortUrl: shortUrl });
  }

  /**
   * Shorten twitter, github urls
   *
   * @param imageUrl
   * @returns {void | string}
   * @private
   */
  _shortenExternalUrl(imageUrl) {
    let shortUrl = imageUrl;

    if (shortUrl.match(imageConstants.twitterImagePrefix)) {
      shortUrl = imageUrl.replace(imageConstants.twitterImageUrlPrefix[0], imageConstants.twitterImageUrlPrefix[1]);
    } else if (shortUrl.match(imageConstants.githubImagePrefix)) {
      shortUrl = imageUrl.replace(
        new RegExp(imageConstants.githubImageUrlPrefix[0]),
        imageConstants.githubImageUrlPrefix[1]
      );
    } else if (shortUrl.match(imageConstants.googleImagePrefix)) {
      shortUrl = imageUrl.replace(
        new RegExp(imageConstants.googleImageUrlPrefix[0]),
        imageConstants.googleImageUrlPrefix[1]
      );
    }

    return shortUrl;
  }
}

module.exports = new ImageLib();
