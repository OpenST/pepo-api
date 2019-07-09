const rootPrefix = '.',
  ImagesModel = require(rootPrefix + '/app/models/mysql/Image'),
  VideosModel = require(rootPrefix + '/app/models/mysql/Video'),
  TextModel = require(rootPrefix + '/app/models/mysql/Text'),
  UserProfileElementModel = require(rootPrefix + '/app/models/mysql/UserProfileElement'),
  imageConst = require(rootPrefix + '/lib/globalConstant/image'),
  videoConst = require(rootPrefix + '/lib/globalConstant/video'),
  userProfileElementConst = require(rootPrefix + '/lib/globalConstant/userProfileElement'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

const imageUrlArray = [
  '{{s3_ui}}/1000-7a45b5f19e9010c90bffaffb67f35dcb-original.jpg',
  '{{s3_ui}}/1001-f1901d35beb6c874814a674553314fb3-original.jpg',
  '{{s3_ui}}/1002-84865392f3a27cd563ec5f8aa6b190fe-original.jpg',
  '{{s3_ui}}/1003-e299db5c248cb9c636e3e58ec72f0631-original.jpg',
  '{{s3_ui}}/1004-41e5a8bd8ea1f46e9788fd5a7245caee-original.jpg'
];

const posterImageUrlArray = [
  '{{s3_ui}}/1000-7a45b5f19e9010c90bffaffb67f35dcb-original.jpg',
  '{{s3_ui}}/1001-f1901d35beb6c874814a674553314fb3-original.jpg',
  '{{s3_ui}}/1002-84865392f3a27cd563ec5f8aa6b190fe-original.jpg',
  '{{s3_ui}}/1003-e299db5c248cb9c636e3e58ec72f0631-original.jpg',
  '{{s3_ui}}/1004-41e5a8bd8ea1f46e9788fd5a7245caee-original.jpg'
];

const videoUrlArray = [
  '{{s3_vi}}/1000-8377bc081a7f55461197359888d256ea-original.mp4',
  '{{s3_vi}}/1001-7a72300b86acd03d6f90e1914ca6cd78-original.mp4',
  '{{s3_vi}}/1002-1b15e8b57ee88e55d46c88dd1a7063cd-original.mp4',
  '{{s3_vi}}/1003-9e3adccb654bbe7267c440f0158dac11-original.mp4',
  '{{s3_vi}}/1004-6dc60c9acb34697c5e1e474c9db22f2b-original.mp4'
];

const textArray = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
  'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim insertId est laborum'
];

class TempSeeder {
  constructor() {}

  async perform() {
    for (let index = 0; index < 5; index++) {
      const imageParams = {
          resolutions: {
            original: {
              width: 100,
              height: 100,
              size: 100,
              url: imageUrlArray[index]
            }
          },
          kind: imageConst.profileImageKind,
          status: imageConst.notResized
        },
        imageResponse = await new ImagesModel().insertImage(imageParams);

      logger.log('====== imageResponse', imageResponse);

      const userProfileElementsParams = {
          userId: 1000 + index,
          dataKind: userProfileElementConst.profileImageIdKind,
          data: imageResponse.insertId
        },
        insertUserProfileElementsRsp = await new UserProfileElementModel().insertElement(userProfileElementsParams);

      logger.log('====== insertUserProfileElementsRsp', insertUserProfileElementsRsp);

      const posterImageParams = {
          resolutions: {
            original: {
              width: 100,
              height: 100,
              size: 100,
              url: posterImageUrlArray[index]
            }
          },
          kind: imageConst.coverImageKind,
          status: imageConst.notResized
        },
        posterImageResponse = await new ImagesModel().insertImage(posterImageParams);

      const videoParams = {
          resolutions: {
            original: {
              width: 100,
              height: 100,
              size: 100,
              url: videoUrlArray[index]
            }
          },
          status: videoConst.notResized,
          posterImageId: posterImageResponse.insertId
        },
        videoResponse = await new VideosModel().insertVideo(videoParams);

      const userProfileElementsParams1 = {
          userId: 1000 + index,
          dataKind: userProfileElementConst.coverVideoIdKind,
          data: videoResponse.insertId
        },
        insertUserProfileElementsRsp1 = await new UserProfileElementModel().insertElement(userProfileElementsParams1);

      logger.log('====== insertUserProfileElementsRsp1', insertUserProfileElementsRsp1);

      const textParams = { text: textArray[index] },
        textResponse = await new TextModel().insertText(textParams);

      const userProfileElementsParams2 = {
          userId: 1000 + index,
          dataKind: userProfileElementConst.bioIdKind,
          data: textResponse.insertId
        },
        insertUserProfileElementsRsp2 = await new UserProfileElementModel().insertElement(userProfileElementsParams2);

      logger.log('====== insertUserProfileElementsRsp2', insertUserProfileElementsRsp2);
    }
  }
}

const tempSeeder = new TempSeeder();

tempSeeder
  .perform()
  .then(function(data) {
    logger.log('\nSuccess data: ', data);
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('\nError data: ', err);
    process.exit(1);
  });
