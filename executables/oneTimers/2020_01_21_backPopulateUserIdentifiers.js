const rootPrefix = '../..',
  UserModel = require(rootPrefix + '/app/models/mysql/User'),
  TwitterUserModel = require(rootPrefix + '/app/models/mysql/TwitterUser'),
  userIdentifierConstants = require(rootPrefix + '/lib/globalConstant/userIdentifier'),
  UserUniqueIdentifierModel = require(rootPrefix + '/app/models/mysql/UserIdentifier'),
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  util = require(rootPrefix + '/lib/util'),
  basicHelper = require(rootPrefix + '/helpers/basic'),
  s3Constants = require(rootPrefix + '/lib/globalConstant/s3'),
  imageConstants = require(rootPrefix + '/lib/globalConstant/image'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const BATCH_SIZE = 100;

class BackPopulateUserUniqueIdentifier {
  constructor() {
    const oThis = this;

    oThis.rotatedUserIds = [];
    oThis.existingUserDataObjects = [];
  }
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    //1. Get all user whose email id is not null
    //2. Check in twitter user if the user is rotated.
    //2.1 If Rotated then put the email and user id in a separate bucket. Make the emails null for this bucket.
    //2.2 If the user is not rotated then add the email in useridentifier table.

    await oThis._fetchAndSegregateUserIds();

    let promiseArray = [];
    promiseArray.push(oThis._performOperationOnRotatedUserIds());
    promiseArray.push(oThis._performOperationOnNonRotatedUserIds());

    await Promise.all(promiseArray);
  }

  /**
   * Fetch and segregate user ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchAndSegregateUserIds() {
    const oThis = this;
    let areRowsRemaining = true,
      page = 0;

    while (areRowsRemaining) {
      let offset = page * BATCH_SIZE,
        dbRows = await new UserModel()
          .select('*')
          .where(['email IS NOT NULL'])
          .limit(BATCH_SIZE)
          .offset(offset)
          .fire();

      page++;

      if (dbRows.length === 0) {
        areRowsRemaining = false;
      } else {
        for (let i = 0; i < dbRows.length; i++) {
          let userId = dbRows[i].id;
          logger.log('Operation initiated for user id: ', userId);
          let isUserRotated = await oThis._isUserRotated(userId);
          if (isUserRotated) {
            oThis.rotatedUserIds.push(userId);
          } else {
            let userDataObject = {
              userId: userId,
              emailId: dbRows[i].email
            };
            oThis.existingUserDataObjects.push(userDataObject);
          }
        }
        await basicHelper.sleep(5000); //Sleeping for sometime after one batch.
      }
    }
  }

  /**
   * Is user rotated
   *
   * @param userId
   * @returns {Promise<void>}
   * @private
   */
  async _isUserRotated(userId) {
    const oThis = this;

    let queryResponse = await new TwitterUserModel()
      .select('*')
      .where(['user_id = ?', userId])
      .fire();

    return queryResponse[0].twitter_id < 0;
  }

  /**
   * Perform operation on rotated user ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performOperationOnRotatedUserIds() {
    const oThis = this;

    console.log('--oThis.rotatedUserIds---', oThis.rotatedUserIds);

    // while(oThis.rotatedUserIds.length > 0){
    //   let userIds = oThis.rotatedUserIds.splice(0, BATCH_SIZE);
    //     await new UserModel()
    //       .update({email: null})
    //       .where({ id: userIds })
    //       .fire();
    // }
  }

  /**
   * Perform operation on non rotated user ids.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _performOperationOnNonRotatedUserIds() {
    const oThis = this;

    console.log('--oThis.existingUserDataObjects--', oThis.existingUserDataObjects);

    // while(oThis.existingUserDataObjects.length > 0){
    //   let userDataObjectsArray = oThis.existingUserDataObjects.splice(0, BATCH_SIZE);
    //
    //   for(let i = 0 ; i < userDataObjectsArray.length ; i++){
    //     let userData = userDataObjectsArray[i];
    //     await new UserUniqueIdentifierModel().insert({
    //       user_id: userData.userId,
    //       e_value: userData.emailId,
    //       e_kind: userIdentifierConstants.invertedKinds[userIdentifierConstants.emailKind]
    //     })
    //   }
    // }
  }
}

new BackPopulateUserUniqueIdentifier()
  .perform()
  .then(function() {
    logger.win('User identifier table back populated successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Error in back-populating. Error: ', err);
    process.exit(1);
  });
