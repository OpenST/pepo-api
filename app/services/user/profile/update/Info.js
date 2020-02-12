const rootPrefix = '../../../../..',
  UserModelClass = require(rootPrefix + '/app/models/mysql/User'),
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  UrlCacheKlass = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  AssociateTagsToUser = require(rootPrefix + '/lib/user/profile/AssociateTags'),
  AddUpdateUserBioClass = require(rootPrefix + '/lib/user/profile/AddUpdateBio'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  AddUpdateUserLinkClass = require(rootPrefix + '/lib/user/profile/AddUpdateLink'),
  UpdateProfileBase = require(rootPrefix + '/app/services/user/profile/update/Base'),
  UserIdByUserNamesCache = require(rootPrefix + '/lib/cacheManagement/multi/UserIdByUserNames'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  userTagConstants = require(rootPrefix + '/lib/globalConstant/userTag'),
  createErrorLogsEntry = require(rootPrefix + '/lib/errorLogs/createEntry'),
  errorLogsConstants = require(rootPrefix + '/lib/globalConstant/errorLogs'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement');

/**
 * Class to update user profile.
 *
 * @class UpdateProfileInfo
 */
class UpdateProfileInfo extends UpdateProfileBase {
  /**
   * Constructor to update user profile.
   *
   * @param {object} params
   * @param {string} params.bio
   * @param {string} params.name
   * @param {string} params.user_name
   * @param {string} params.link: social link added by user
   * @param {number} params.profile_user_id
   * @param {object} params.current_user
   *
   * @augments UpdateProfileBase
   *
   * @constructor
   */
  constructor(params) {
    super(params);

    logger.log('======= params for update info ========', params);

    const oThis = this;

    oThis.bio = oThis.params.bio;
    oThis.name = oThis.params.name;
    oThis.username = oThis.params.user_name;
    oThis.link = oThis.params.link;

    oThis.flushUserCache = false;
    oThis.flushUserProfileElementsCache = false;

    oThis.userUpdateRequired = true;
    oThis.bioUpdateRequired = true;
    oThis.linkUpdateRequired = true;
    oThis.tagIds = [];
  }

  /**
   * Validate params.
   *
   * @sets oThis.bio
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateParams() {
    const oThis = this;

    if (!oThis.name) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_up_1',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_name'],
          debug_options: {}
        })
      );
    }

    if (!oThis.username) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_up_2',
          api_error_identifier: 'invalid_params',
          params_error_identifiers: ['invalid_user_name'],
          debug_options: {}
        })
      );
    }

    if (oThis.bio) {
      oThis.bio = CommonValidators.sanitizeText(oThis.bio);
    }

    await oThis._validateUserName();
  }

  /**
   * Validate username.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validateUserName() {
    const oThis = this;

    if (oThis.userObj.userName.toString().toLowerCase() === oThis.username.toLowerCase()) {
      return;
    }

    let cacheResponse = await new UserIdByUserNamesCache({ userNames: [oThis.username] }).fetch();

    if (cacheResponse.isFailure()) {
      return Promise.reject(cacheResponse);
    }

    if (cacheResponse.data[oThis.username].id) {
      return Promise.reject(
        responseHelper.paramValidationError({
          internal_error_identifier: 'a_s_u_p_up_3',
          api_error_identifier: 'invalid_api_params',
          params_error_identifiers: ['duplicate_user_name'],
          debug_options: { user_name: oThis.username }
        })
      );
    }
  }

  /**
   * Check whether update is required or not.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _isUpdateRequired() {
    const oThis = this;

    // Check whether user update is required or not
    if (
      oThis.userObj.name.toString() === oThis.name &&
      oThis.userObj.userName.toString().toLowerCase() === oThis.username.toLowerCase()
    ) {
      oThis.userUpdateRequired = false;
    }

    // If bio is present then check whether same bio is added or its updated.
    if (oThis.profileElements[userProfileElementConst.bioIdKind]) {
      const textId = oThis.profileElements[userProfileElementConst.bioIdKind].data,
        textResp = await new TextsByIdCache({ ids: [textId] }).fetch(),
        textObj = textResp.data[textId];

      if (textObj.text.toString() === oThis.bio.toString()) {
        oThis.bioUpdateRequired = false;
      }
    } else {
      if (oThis.bio.toString() === '') {
        oThis.bioUpdateRequired = false;
      }
    }

    // If link is present then check whether same link is added or its updated.
    if (oThis.profileElements[userProfileElementConst.linkIdKind]) {
      const linkId = oThis.profileElements[userProfileElementConst.linkIdKind].data,
        urlResp = await new UrlCacheKlass({ ids: [linkId] }).fetch(),
        urlObj = urlResp.data[linkId];

      if (urlObj.url.toString() === oThis.link.toString()) {
        oThis.linkUpdateRequired = false;
      }
    } else {
      if (oThis.link.toString() === '') {
        oThis.linkUpdateRequired = false;
      }
    }

    if (!oThis.userUpdateRequired && !oThis.bioUpdateRequired && !oThis.linkUpdateRequired) {
      return responseHelper.successWithData({ noUpdates: true });
    }

    return responseHelper.successWithData({ noUpdates: false });
  }

  /**
   * Method to update profile elements.
   *
   * @sets oThis.tagIds
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateProfileElements() {
    const oThis = this;

    const promises = [];

    if (oThis.bioUpdateRequired) {
      // Update user bio
      promises.push(
        new AddUpdateUserBioClass({
          bio: oThis.bio,
          userId: oThis.profileUserId,
          profileElementObj: oThis.profileElements[userProfileElementConst.bioIdKind],
          flushCache: 0
        })
          .perform()
          .then(async function(resp) {
            if (resp.data && resp.data.tagIds) {
              oThis.tagIds = resp.data.tagIds;

              await new AssociateTagsToUser({
                userId: oThis.profileUserId,
                tagIds: oThis.tagIds,
                tagAddedKind: userTagConstants.selfAddedKind
              }).perform();
            }
          })
      );
      oThis.flushUserProfileElementsCache = true;
    }

    if (oThis.linkUpdateRequired) {
      // Update user social link
      promises.push(
        new AddUpdateUserLinkClass({
          url: oThis.link,
          userId: oThis.profileUserId,
          profileElementObj: oThis.profileElements[userProfileElementConst.linkIdKind],
          flushCache: 0
        }).perform()
      );
      oThis.flushUserProfileElementsCache = true;
    }

    if (promises.length > 0) {
      await Promise.all(promises);
    }

    return responseHelper.successWithData({});
  }

  /**
   * Update user.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUser() {
    const oThis = this;

    if (oThis.userUpdateRequired) {
      await new UserModelClass()
        .update({
          name: oThis.name,
          user_name: oThis.username
        })
        .where({ id: oThis.profileUserId })
        .fire()
        .catch(async function(err) {
          await oThis._flushCaches();

          if (UserModelClass.isDuplicateIndexViolation(UserModelClass.usernameUniqueIndexName, err)) {
            return Promise.reject(
              responseHelper.paramValidationError({
                internal_error_identifier: 'a_s_u_p_up_4',
                api_error_identifier: 'invalid_api_params',
                params_error_identifiers: ['duplicate_user_name'],
                debug_options: { user_name: oThis.username }
              })
            );
          }
          // Insert failed due to some other reason.
          // Send error email from here.
          const errorObject = responseHelper.error({
            internal_error_identifier: 'a_s_u_p_up_5',
            api_error_identifier: 'something_went_wrong',
            debug_options: { Error: err }
          });

          await createErrorLogsEntry.perform(errorObject, errorLogsConstants.highSeverity);

          return Promise.reject(errorObject);
        });

      oThis.flushUserCache = true;
    }
  }

  /**
   * Extra updates which needs to be done.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _extraUpdates() {
    const oThis = this;
  }

  /**
   * Prepares Response
   *
   * @returns {*|result}
   * @private
   */
  _prepareResponse() {
    const oThis = this;

    return responseHelper.successWithData({});
  }
}

module.exports = UpdateProfileInfo;
