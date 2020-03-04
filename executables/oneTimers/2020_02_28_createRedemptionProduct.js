const program = require('commander');

const rootPrefix = '../..',
  CommonValidators = require(rootPrefix + '/lib/validators/Common'),
  ProductModel = require(rootPrefix + '/app/models/mysql/redemption/Product'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  redemptionConstants = require(rootPrefix + '/lib/globalConstant/redemption/redemption');

program
  .option('--productKind <productKind>', 'Product name.')
  .option('--images <images>', 'Map of images.')
  .option('--prodDescription <prodDescription>', 'Product description')
  .option('--dollarValue <dollarValue>', 'Product dollar value')
  .option('--minDollarValue <minDollarValue>', 'Product min dollar value')
  .option('--maxDollarValue <maxDollarValue>', 'Product max dollar value. Pass 0, if no max limit.')
  .option('--dollarStep <dollarStep>', 'Product dollar step')
  .option('--displayOrder <displayOrder>', 'Product display order. Default is 1')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(
    '    node executables/oneTimers/2020_02_28_createRedemptionProduct --productKind "UNSTOPPABLE DOMAINS" --images \'{"square":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-uber-1x1.png","landscape":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-uber-16x9.png"}\' --prodDescription \'Blockchain domains replace crypto addresses with human readable names and can be used to build censorship resistant websites. Get your code to purchase <a href="https://unstoppabledomains.com/pepo-preview/" rel="noopener noreferrer nofollow" title="Unstoppable domains"> Unstoppable domains </a>\' --dollarValue 5.00 --minDollarValue 5.00 --maxDollarValue 0 --dollarStep 1.00 --displayOrder 1.12'
  );
  logger.log('');
  logger.log('');
});

class CreateProducts {
  constructor(params) {
    const oThis = this;
    oThis.productKind = params.productKind;
    oThis.description = params.description;
    oThis.images = params.images;
    oThis.dollarValue = params.dollarValue;
    oThis.minDollarValue = params.minDollarValue;
    oThis.maxDollarValue = params.maxDollarValue;
    oThis.dollarStep = params.dollarStep;
    oThis.displayOrder = params.displayOrder;
  }

  async perform() {
    const oThis = this;

    await oThis._validate();

    const dbRow = await new ProductModel()
      .select('*')
      .where({
        kind: oThis.productKind
      })
      .fire();

    if (dbRow.length) {
      let params = {};

      if (oThis.images) {
        params['images'] = oThis.images;
      }
      if (oThis.description) {
        params['description'] = oThis.description;
      }
      if (oThis.dollarValue) {
        params['dollar_value'] = oThis.dollarValue;
      }
      if (oThis.minDollarValue) {
        params['min_dollar_value'] = oThis.minDollarValue;
      }
      if (oThis.maxDollarValue) {
        params['max_dollar_value'] = oThis.maxDollarValue > 0 ? oThis.maxDollarValue : null;
      }
      if (oThis.dollarStep) {
        params['dollar_step'] = oThis.dollarStep;
      }
      if (oThis.displayOrder) {
        params['display_order'] = oThis.displayOrder;
      }

      if (CommonValidators.validateNonEmptyObject(params)) {
        await new ProductModel()
          .update(params)
          .where({ kind: oThis.productKind })
          .fire();
      }
    } else {
      await new ProductModel()
        .insert({
          kind: oThis.productKind,
          images: oThis.images,
          description: oThis.description,
          dollar_value: oThis.dollarValue,
          min_dollar_value: oThis.minDollarValue,
          max_dollar_value: oThis.maxDollarValue > 0 ? oThis.maxDollarValue : null,
          dollar_step: oThis.dollarStep,
          display_order: oThis.displayOrder || 1,
          status: redemptionConstants.invertedStatuses[redemptionConstants.activeStatus]
        })
        .fire();
    }

    await ProductModel.flushCache();
  }

  /**
   * Validate.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _validate() {
    const oThis = this;

    if (oThis.images) {
      const imagesObj = JSON.parse(oThis.images);

      for (let imageType in imagesObj) {
        if (!redemptionConstants.allowedRedemptionTypes[imageType]) {
          return Promise.reject(
            responseHelper.error({
              internal_error_identifier: 'e_ot_crp_1',
              api_error_identifier: 'something_went_wrong',
              debug_options: { imageType: imageType }
            })
          );
        }
      }
    }

    if (
      !CommonValidators.validateNumber(oThis.dollarValue) ||
      !CommonValidators.validateNumber(oThis.minDollarValue) ||
      !CommonValidators.validateNumber(oThis.maxDollarValue) ||
      !CommonValidators.validateNumber(oThis.dollarStep)
    ) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_ot_crp_2',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            dollarValue: oThis.dollarValue,
            minDollarValue: oThis.minDollarValue,
            maxDollarValue: oThis.maxDollarValue,
            dollarStep: oThis.dollarStep
          }
        })
      );
    }

    if (oThis.maxDollarValue > 0 && oThis.minDollarValue > oThis.maxDollarValue) {
      return Promise.reject(
        responseHelper.error({
          internal_error_identifier: 'e_ot_crp_3',
          api_error_identifier: 'something_went_wrong',
          debug_options: {
            minDollarValue: oThis.minDollarValue,
            maxDollarValue: oThis.maxDollarValue
          }
        })
      );
    }

    if (oThis.description) {
      if (!CommonValidators.isExternalLinkSafe(oThis.description)) {
        return Promise.reject(
          responseHelper.error({
            internal_error_identifier: 'e_ot_crp_4',
            api_error_identifier: 'something_went_wrong',
            debug_options: { description: oThis.description }
          })
        );
      }
    }
  }
}

new CreateProducts({
  productKind: program.productKind,
  images: program.images,
  description: program.prodDescription,
  dollarValue: program.dollarValue,
  minDollarValue: program.minDollarValue,
  maxDollarValue: program.maxDollarValue,
  dollarStep: program.dollarStep,
  displayOrder: program.displayOrder
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
