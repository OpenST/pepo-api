const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TagModel = require(rootPrefix + '/app/models/mysql/Tag'),
  UserTagModel = require(rootPrefix + '/app/models/mysql/UserTag'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  VideoTagsModel = require(rootPrefix + '/app/models/mysql/VideoTag'),
  VideoDetailsModel = require(rootPrefix + '/app/models/mysql/VideoDetail'),
  videoDetailsConstants = require(rootPrefix + '/lib/globalConstant/videoDetail'),
  userConstants = require(rootPrefix + '/lib/globalConstant/user'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class VideoTagsSanitize {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const userList = await new UserModel().select('id,user_name,name,email,properties,status').fire();

    for (let ul = 0; ul < userList.length; ul++) {
      let user = userList[ul];
      logger.step('Start Processing user: ', JSON.stringify(user));

      if (user.status == userConstants.invertedStatuses[userConstants.inActiveStatus]) {
        //If Users Blocked decrease user's tags weights.
        let tagIds = [];
        let userTagRecords = await new UserTagModel()
          .select('*')
          .where({ user_id: user.id })
          .fire();
        for (let utr = 0; utr < userTagRecords.length; utr++) {
          tagIds.push(userTagRecords[utr].tag_id);
        }

        logger.log('decresing weight for tag ids: ', JSON.stringify(tagIds));
        if (tagIds && tagIds.length > 0) {
          await new TagModel()
            .update('weight = weight-1')
            .where(['id in (?) AND weight>0', tagIds])
            .fire();
        }
      } else {
        const userVideoIds = [],
          userTextIds = [],
          userVideoTagIds = [];
        const userVideosDbResp = await new VideoDetailsModel()
          .select('*')
          .where({
            creator_user_id: user.id,
            status: videoDetailsConstants.invertedStatuses[videoDetailsConstants.activeStatus]
          })
          .fire();
        for (let ut = 0; ut < userVideosDbResp.length; ut++) {
          userVideoIds.push(userVideosDbResp[ut].id);
          userTextIds.push(userVideosDbResp[ut].description_id);
        }
        console.log(
          'user video ids:',
          userVideoIds,
          user.properties & userConstants.invertedProperties[userConstants.isApprovedCreatorProperty]
        );
        if (userVideoIds.length == 0) {
          continue;
        }

        if (user.properties & userConstants.invertedProperties[userConstants.isApprovedCreatorProperty]) {
          //Increment video_weight for user's all non deleted video tags.
          const videoTagDbResp = await new VideoTagsModel()
            .select('*')
            .where({ video_id: userVideoIds })
            .fire();
          for (let vtd = 0; vtd < videoTagDbResp.length; vtd++) {
            userVideoTagIds.push(videoTagDbResp[vtd].tag_id);
          }

          logger.log("Incresing video_weight in Tags for user's userVideoTagIds: ", userVideoTagIds);
          if (userVideoTagIds && userVideoTagIds.length > 0) {
            await new TagModel()
              .update('video_weight = video_weight+1')
              .where({ id: userVideoTagIds })
              .fire();
          }
        } else {
          logger.log("Removing from video tags for user's video ids: ", JSON.stringify(userVideoIds));
          await new VideoTagsModel()
            .delete()
            .where({ video_id: userVideoIds })
            .fire();

          if (userTextIds.length > 0) {
            // 2. Remove tag ids from text table respective to text used.
            logger.log('Removing tag_ids from Text for ids: ', JSON.stringify(userTextIds));
            await new TextModel()
              .update('tag_ids = NULL')
              .where({ id: userTextIds })
              .fire();
          }
        }
      }

      logger.log('End user id: ', userList[ul].id);
    }
  }
}

new VideoTagsSanitize()
  .perform()
  .then(function() {
    logger.win('All user videos processed successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Sorry Bhai, Fat gaya.... Error: ', err);
    process.exit(1);
  });
