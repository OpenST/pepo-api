const program = require('commander');

const rootPrefix = '../..',
  ProductModel = require(rootPrefix + '/app/models/mysql/redemption/Product'),
  logger = require(rootPrefix + '/lib/logger/customConsoleLogger'),
  redemptionConstants = require(rootPrefix + '/lib/globalConstant/redemption/redemption');

program
  .option('--productKind <productKind>', 'Product name.')
  .option('--images <images>', 'Map of images.')
  .option('--description <description>', 'Product description')
  .option('--dollarValue <dollarValue>', 'Product dollar value')
  .option('--minDollarValue <minDollarValue>', 'Product min dollar value')
  .option('--dollarStep <dollarStep>', 'Product dollar step')
  .parse(process.argv);

program.on('--help', function() {
  logger.log('');
  logger.log('  Example:');
  logger.log('');
  logger.log(
    '    node executables/oneTimers/2020_02_28_createRedemptionProduct --productKind "UNSTOPPABLE DOMAINS" --images \'{"square":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-uber-1x1.png","landscape":"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-uber-16x9.png"}\' --description \'Blockchain domains replace crypto addresses with human readable names and can be used to build censorship resistant websites. Get your code to purchase <a href="https://unstoppabledomains.com/pepo-preview/" rel="noopener noreferrer nofollow" title="Unstoppable domains"> Unstoppable domains </a>\' --dollarValue 10.00 --minDollarValue 10.00 --dollarStep 1.00'
  );
  logger.log('');
  logger.log('');
});

if (!program.productKind || !program.images || !program.dollarValue || !program.minDollarValue || !program.dollarStep) {
  program.help();
  process.exit(1);
}

class CreateProducts {
  constructor(params) {
    const oThis = this;
    oThis.productKind = params.productKind;
    oThis.description = params.description;
    oThis.images = params.images;
    oThis.dollarValue = params.dollarValue;
    oThis.minDollarValue = params.minDollarValue;
    oThis.dollarStep = params.dollarStep;
  }

  async perform() {
    const oThis = this;

    await new ProductModel()
      .insert({
        kind: oThis.productKind,
        images: oThis.images,
        description: oThis.description,
        dollar_value: oThis.dollarValue,
        min_dollar_value: oThis.minDollarValue,
        dollar_step: oThis.dollarStep,
        status: redemptionConstants.invertedStatuses[redemptionConstants.activeStatus]
      })
      .fire();

    await ProductModel.flushCache();
  }
}

new CreateProducts({
  productKind: program.productKind,
  images: program.images,
  description: program.description,
  dollarValue: program.dollarValue,
  minDollarValue: program.minDollarValue,
  dollarStep: program.dollarStep
})
  .perform()
  .then(function() {
    process.exit(0);
  })
  .catch(function(err) {
    logger.log(err);
    process.exit(1);
  });
