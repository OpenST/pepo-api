const rootPrefix = '..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  TagByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/Tag'),
  UserMultiCache = require(rootPrefix + '/lib/cacheManagement/multi/User'),
  UrlByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/UrlsByIds'),
  TextsByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/TextsByIds'),
  VideoByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/VideoByIds'),
  ImageByIdCache = require(rootPrefix + '/lib/cacheManagement/multi/ImageByIds'),
  TextIncludesByIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TextIncludesByTextIds'),
  TokenUserDetailByUserIdsCache = require(rootPrefix + '/lib/cacheManagement/multi/TokenUserByUserIds'),
  textConstants = require(rootPrefix + '/lib/globalConstant/text'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  textIncludeConstants = require(rootPrefix + '/lib/globalConstant/cassandra/textInclude');

/**
 * Class to fetch associated entities.
 *
 * @class FetchAssociatedEntities
 */
class FetchAssociatedEntities {
  /**
   * Constructor to fetch associated entities.
   *
   * @param {object} params
   * @param {array<number>} [params.linkIds]
   * @param {array<number>} [params.tagIds]
   * @param {array<number>} [params.textIds]
   * @param {array<number>} [params.videoIds]
   * @param {array<number>} [params.userIds]
   * @param {array<number>} [params.imageIds]
   *
   * @constructor
   */
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
   * Main performer of class.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._fetchTagAndLinksFromText();

    const promisesArray = [
      oThis._fetchTags(),
      oThis._fetchLinks(),
      oThis._fetchVideos(),
      oThis._fetchUsers(),
      oThis._fetchTokenUsers()
    ];
    await Promise.all(promisesArray);

    // Images are fetched later to fetch profile images and poster images of videos too.
    await oThis._fetchImages();

    return oThis._formatResponse();
  }

  /**
   * Fetch tag and links from texts.
   *
   * @sets oThis.textData, oThis.includesData, oThis.linkIds, oThis.tagIds, oThis.userIds
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

        if (entity[0] === textIncludeConstants.tagEntityKindShort) {
          allTagIds.push(+entity[1]);
        } else if (
          entity[0] === textIncludeConstants.linkEntityKindShort &&
          oThis.textData[textId].kind === textConstants.videoDescriptionKind
        ) {
          allLinkIds.push(+entity[1]); // Inserting only video description links, bio links are ignored
        } else if (entity[0] === textIncludeConstants.userEntityKindShort) {
          oThis.userIds.push(+entity[1]);
        }
      }
    }

    oThis.linkIds = [...new Set(oThis.linkIds.concat(allLinkIds))];
    oThis.tagIds = [...new Set(oThis.tagIds.concat(allTagIds))];
    oThis.userIds = [...new Set(oThis.userIds)];
  }

  /**
   * Fetch tags if present.
   *
   * @sets oThis.tags
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
   * Fetch links if present.
   *
   * @sets oThis.links
   *
   * @returns {Promise<never>}
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

    const response = {
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
   *
   * @private
   */
  _formatTextResponse() {
    const oThis = this;

    for (const textId in oThis.textData) {
      const textIncludes = oThis.includesData[textId],
        tagIds = [],
        linkIds = [],
        atMentionedUserIds = [],
        replaceableTagNameToTagIdMap = {},
        userIdsToReplaceableMentionedUserNameMap = [];

      // Fetch link id and tag ids
      for (let ind = 0; ind < textIncludes.length; ind++) {
        const includeRow = textIncludes[ind],
          entity = includeRow.entityIdentifier.split('_');

        if (entity[0] === textIncludeConstants.tagEntityKindShort) {
          tagIds.push(+entity[1]);
          let tagName = includeRow.replaceableText.trim();
          replaceableTagNameToTagIdMap[tagName] = +entity[1];
        } else if (entity[0] === textIncludeConstants.linkEntityKindShort) {
          linkIds.push(+entity[1]);
        } else if (entity[0] === textIncludeConstants.userEntityKindShort) {
          atMentionedUserIds.push(+entity[1]);
          userIdsToReplaceableMentionedUserNameMap[+entity[1]] = includeRow.replaceableText;
        }
      }

      const formatTextParams = {
        textId: textId,
        tagIds: tagIds,
        linkIds: linkIds,
        userIds: atMentionedUserIds,
        replaceableTagNameToTagIdMap: replaceableTagNameToTagIdMap,
        userIdToUsernameMap: userIdsToReplaceableMentionedUserNameMap
      };
      const textIncludesData = oThis._formatIncludesDataInText(formatTextParams);
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
        for (let tagName in params.replaceableTagNameToTagIdMap) {
          const tagId = params.replaceableTagNameToTagIdMap[tagName],
            tagDetail = oThis.tags[tagId];

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
   * Fetch videos if video ids are passed.
   *
   * @sets oThis.imageIds, oThis.videos
   *
   * @returns {Promise<*|result>}
   * @private
   */
  async _fetchVideos() {
    const oThis = this;

    if (oThis.videoIds.length <= 0) {
      return responseHelper.successWithData({});
    }

    const cacheRsp = await new VideoByIdCache({ ids: oThis.videoIds }).fetch();

    if (cacheRsp.isFailure()) {
      return Promise.reject(cacheRsp);
    }

    for (const videoId in cacheRsp.data) {
      const video = cacheRsp.data[videoId],
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
   * @sets oThis.usersMap, oThis.imageIds
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

    for (const userId in cacheRsp.data) {
      const user = cacheRsp.data[userId],
        profileImageId = user.profileImageId;

      if (CommonValidators.validateNonEmptyObject(user) && user.status === userConstants.activeStatus) {
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
   * Fetch images if present.
   *
   * @sets oThis.images
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
