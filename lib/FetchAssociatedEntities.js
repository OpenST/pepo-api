const rootPrefix = '..',
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  commonValidators = require(rootPrefix + '/lib/validators/Common'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class FetchAssociatedEntities {
  constructor(params) {
    const oThis = this;

    oThis.linkIds = params.linkIds || [];
    oThis.tagIds = params.tagIds || [];
    oThis.textIds = params.textIds || [];
    oThis.videoIds = params.videoIds || [];
    oThis.userIds = params.userIds || [];
    oThis.imageIds = params.imageIds || [];

    oThis.textData = {};
    oThis.includesData = {};
    oThis.tags = {};
    oThis.links = {};
    oThis.textMap = {};
    oThis.videos = {};
    oThis.usersMap = {};
    oThis.tokenUsersByUserIdMap = {};
    oThis.images = {};
  }

  /**
   * Main performer of class
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchTagAndLinksFromText();

    let promisesArray = [];
    promisesArray.push(oThis._fetchTags());
    promisesArray.push(oThis._fetchLinks());
    promisesArray.push(oThis._fetchVideos());
    promisesArray.push(oThis._fetchUsers());
    promisesArray.push(oThis._fetchTokenUsers());
    await Promise.all(promisesArray);

    // Images are fetched later to fetch profile images and poster images of videos too.
    await oThis._fetchImages();

    return oThis._formatResponse();
  }

  /**
   * Fetch tag and links from texts
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTagAndLinksFromText() {
    const oThis = this;

    if (oThis.textIds.length > 0) {
      const cacheRsp = await new TextsByIdCache({ ids: oThis.textIds }).fetch();
      if (cacheRsp.isFailure()) {
        return Promise.reject(cacheRsp);
      }

      oThis.textData = cacheRsp.data;

      const includesCacheRsp = await new TextIncludesByIdsCache({ ids: oThis.textIds }).fetch();
      if (includesCacheRsp.isFailure()) {
        return Promise.reject(includesCacheRsp);
      }

      oThis.includesData = includesCacheRsp.data;
    }

    const allTagIds = [],
      allLinkIds = [];
    for (const textId in oThis.includesData) {
      const textIncludes = oThis.includesData[textId];

      for (let ind = 0; ind < textIncludes.length; ind++) {
        const include = textIncludes[ind],
          entity = include.entityIdentifier.split('_');

        if (entity[0] == textIncludeConstants.tagEntityKindShort) {
          allTagIds.push(+entity[1]);
        } else if (
          entity[0] == textIncludeConstants.linkEntityKindShort &&
          oThis.textData[textId].kind === textConstants.videoDescriptionKind
        ) {
          allLinkIds.push(+entity[1]); // Inserting only video description links, bio links are ignored
        } else if (entity[0] == textIncludeConstants.userEntityKindShort) {
          oThis.userIds.push(+entity[1]);
        }
      }
    }

    oThis.linkIds = [...new Set(oThis.linkIds.concat(allLinkIds))];
    oThis.tagIds = [...new Set(oThis.tagIds.concat(allTagIds))];
    oThis.userIds = [...new Set(oThis.userIds)];
  }

  /**
   * Fetch tags if present
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchTags() {
    const oThis = this;

    if (oThis.tagIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new TagByIdCache({ ids: oThis.tagIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.tags = cacheRsp.data;
  }

  /**
   * Fetch link
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchLinks() {
    const oThis = this;

    if (oThis.linkIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new UrlByIdCache({ ids: oThis.linkIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.links = cacheRsp.data;
  }

  /**
   * Format response to be returned.
   *
   * @returns {*|result}
   * @private
   */
  _formatResponse() {
    const oThis = this;

    oThis._formatTextResponse();

    let response = {
      tags: oThis.tags,
      links: oThis.links,
      textMap: oThis.textMap,
      videosMap: oThis.videos,
      usersMap: oThis.usersMap,
      tokenUsersByUserIdMap: oThis.tokenUsersByUserIdMap,
      imagesMap: oThis.images
    };
    return responseHelper.successWithData(response);
  }

  /**
   * Format text response to be sent.
   * @private
   */
  _formatTextResponse() {
    const oThis = this;

    for (const textId in oThis.textData) {
      const textIncludes = oThis.includesData[textId],
        tagIds = [],
        linkIds = [],
        atMentionedUserIds = [],
        tagIdsToReplaceableTagNameMap = {},
        userIdsToReplaceableMentionedUserNameMap = [];

      // Fetch link id and tag ids
      for (let ind = 0; ind < textIncludes.length; ind++) {
        const includeRow = textIncludes[ind],
          entity = includeRow.entityIdentifier.split('_');

        if (entity[0] == textIncludeConstants.tagEntityKindShort) {
          tagIds.push(+entity[1]);
          tagIdsToReplaceableTagNameMap[+entity[1]] = includeRow.replaceableText;
        } else if (entity[0] == textIncludeConstants.linkEntityKindShort) {
          linkIds.push(+entity[1]);
        } else if (entity[0] == textIncludeConstants.userEntityKindShort) {
          atMentionedUserIds.push(+entity[1]);
          userIdsToReplaceableMentionedUserNameMap[+entity[1]] = includeRow.replaceableText;
        }
      }

      let formatTextParams = {
        textId: textId,
        tagIds: tagIds,
        linkIds: linkIds,
        userIds: atMentionedUserIds,
        tagIdToTagNameMap: tagIdsToReplaceableTagNameMap,
        userIdToUsernameMap: userIdsToReplaceableMentionedUserNameMap
      };
      let textIncludesData = oThis._formatIncludesDataInText(formatTextParams);
      if (textIncludesData) {
        oThis.textMap[textId] = textIncludesData;
      }
    }
  }

  /**
   *  Format tags, links and at mentions present in text.
   *
   * @returns {{includes: {}, text: *}}
   * @private
   */
  _formatIncludesDataInText(params) {
    const oThis = this;

    if (oThis.textData[params.textId] && oThis.textData[params.textId].text) {
      const textData = {
        text: oThis.textData[params.textId].text,
        includes: {}
      };

      if (params.tagIds) {
        for (let ind = 0; ind < params.tagIds.length; ind++) {
          let tagId = params.tagIds[ind],
            tagDetail = oThis.tags[tagId],
            tagName = params.tagIdToTagNameMap[tagId];

          textData.includes[tagName] = {
            kind: 'tags',
            id: tagDetail.id
          };
        }
      }

      if (params.linkIds) {
        for (let ind = 0; ind < params.linkIds.length; ind++) {
          const linkId = params.linkIds[ind];

          textData.includes[oThis.links[linkId].url] = {
            kind: 'links',
            id: linkId
          };
        }
      }

      if (params.userIds) {
        for (let ind = 0; ind < params.userIds.length; ind++) {
          const mentionedUserId = params.userIds[ind];

          textData.includes[params.userIdToUsernameMap[mentionedUserId]] = {
            kind: 'users',
            id: mentionedUserId
          };
        }
      }

      return textData;
    }

    return null;
  }

  /**
   * Fetch videos if video ids are passed
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchVideos() {
    const oThis = this;

    if (oThis.videoIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    let cacheRsp = await new VideoByIdCache({ ids: oThis.videoIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    for (let videoId in cacheRsp.data) {
      let video = cacheRsp.data[videoId],
        posterImageId = video.posterImageId;
      if (posterImageId) {
        oThis.imageIds.push(posterImageId);
      }
    }

    oThis.videos = cacheRsp.data;
  }

  /**
   * Fetch user details.
   *
   * @returns {Promise<never>}
   * @private
   */
  async _fetchUsers() {
    const oThis = this;

    if (oThis.userIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new UserMultiCache({ ids: oThis.userIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    for (let userId in cacheRsp.data) {
      let user = cacheRsp.data[userId],
        profileImageId = user.profileImageId;

      if (commonValidators.validateNonEmptyObject(user) && user.status === userConstants.activeStatus) {
        oThis.usersMap[userId] = user;
      }

      if (profileImageId) {
        oThis.imageIds.push(profileImageId);
      }
    }
  }

  /**
   * Fetch token users.
   *
   * @sets oThis.tokenUsersByUserIdMap
   *
   * @return {Promise<*>}
   * @private
   */
  async _fetchTokenUsers() {
    const oThis = this;

    if (oThis.userIds.length === 0) {
      return;
    }

    const tokenUserRes = await new TokenUserDetailByUserIdsCache({ userIds: oThis.userIds }).fetch();

    if (tokenUserRes.isFailure()) {
      return Promise.reject(tokenUserRes);
    }

    oThis.tokenUsersByUserIdMap = tokenUserRes.data;
  }

  /**
   * Fetch image.
   *
   * @return {Promise<never>}
   * @private
   */
  async _fetchImages() {
    const oThis = this;

    if (oThis.imageIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new ImageByIdCache({ ids: oThis.imageIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    oThis.images = cacheRsp.data;
  }
}

module.exports = FetchAssociatedEntities;
