const rootPrefix = '../..',
  ImageModel = require(rootPrefix + '/app/models/mysql/Image'),
  ResizeImageLib = require(rootPrefix + '/lib/resize/Image'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  coreConstants = require(rootPrefix + '/config/coreConstants');

const isQualityChanged = process.argv[2],
  BATCH_SIZE = 10;

class ResizeImages {
  constructor() {
    const oThis = this;

    oThis.count = 0;
  }

  async perform() {
    const oThis = this;

    console.log('isQualityChanged ', isQualityChanged);

    await oThis._getImageCount();

    await oThis._resize();
  }

  async _getImageCount() {
    const oThis = this,
      resp = await new ImageModel().select('count(*) as count').fire();

    oThis.count = resp[0].count;
    console.log('oThis.count ', oThis.count);
  }

  async _resize() {
    const oThis = this;

    let promiseArray = [];

    for (let index = 1; index < oThis.count; index++) {
      promiseArray.push(new ResizeImageLib({ imageId: index }).perform());

      if (promiseArray.length >= BATCH_SIZE || oThis.count === index) {
        await Promise.all(promiseArray);
        promiseArray = [];
      }
    }
  }
}

new ResizeImages()
  .perform()
  .then(function(rsp) {
    process.exit(0);
  })
  .catch(function(err) {
    console.log(err);
    process.exit(1);
  });
