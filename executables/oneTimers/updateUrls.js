const rootPrefix = '../..',
  UrlModel = require(rootPrefix + '/app/models/mysql/Url'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger');

class UpdateUrls {
  /**
   * Perform.
   *
   * @returns {Promise<void>}
   */
  async perform() {
    const oThis = this;

    await oThis._updateUrls();
  }

  /**
   * Update urls.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _updateUrls() {
    const oThis = this;
    let ids = [],
      urls = await new UrlModel().select('*').fire();
    for (let i = 0; i < urls.length; i++) {
      let splitedUrl = urls[i].url.split('://');
      if (splitedUrl[0] !== 'http' && splitedUrl[0] !== 'https') {
        ids.push(urls[i].id);
      }
    }

    for (let i = 0; i < ids.length; i++) {
      let urlRow = await new UrlModel()
        .select('*')
        .where(['id = ?', ids[i]])
        .fire();
      let splitedUrl = urlRow[0].url.split(':');
      let modifiedUrl = 'https://';

      if (splitedUrl.length > 1) {
        modifiedUrl += splitedUrl[1];
      } else {
        modifiedUrl += splitedUrl[0];
      }

      await new UrlModel()
        .update({
          url: modifiedUrl
        })
        .where(['id = ?', ids[i]])
        .fire();
    }
  }
}

new UpdateUrls()
  .perform()
  .then(function() {
    logger.win('All urls are updated successfully.');
    process.exit(0);
  })
  .catch(function(err) {
    logger.error('Update Urls failed. Error: ', err);
    process.exit(1);
  });
