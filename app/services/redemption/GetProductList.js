const rootPrefix = '../../..',
  ServiceBase = require(rootPrefix + '/app/services/Base'),
  GetUserBalance = require(rootPrefix + '/app/services/user/GetBalance'),
  PricePointsCache = require(rootPrefix + '/lib/cacheManagement/single/PricePoints'),
  RedemptionProductsCache = require(rootPrefix + '/lib/cacheManagement/single/RedemptionProducts'),
  GetPepocornBalance = require(rootPrefix + '/lib/pepocorn/GetPepocornBalance'),
  redemptionConstants = require(rootPrefix + '/lib/globalConstant/redemption/redemption'),
  responseHelper = require(rootPrefix + '/lib/formatter/response');

class GetRedemptionInfo extends ServiceBase {
  constructor(params) {
    super(params);

    const oThis = this;
    oThis.currentUser = params.current_user;
    oThis.pricePoints = {};
  }

  /**
   * async perform
   *
   * @return {Promise<any>}
   * @private
   */
  async _asyncPerform() {
    const oThis = this;

    // NOTE - DO NOT UNCOMMENT AND COMMIT.
    // let r = {
    //   redemption_products: [ { id: '1',
    //     status: 'ACTIVE',
    //     kind: 'AMAZON',
    //     createdAt: 1568608359,
    //     updatedAt: 1568608359,
    //     images: {
    //       square:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-amazon-1x1.png",
    //       landscape:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-amazon-16x9.png"
    //     },
    //     dollar_value: 10,
    //     min_dollar_value: 10,
    //     dollar_step: 1,
    //     pepocorn_per_step: 1
    //   },
    //     { id: '2',
    //       status: 'ACTIVE',
    //       kind: 'STARBUCKS',
    //       created_at: 1568608359,
    //       updated_at: 1568608359,
    //       images: {
    //         square:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-starbucks-1x1.png",
    //         landscape:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-starbucks-16x9.png"
    //       },
    //       dollar_value: 10
    //     },
    //     { id: '3',
    //       status: 'ACTIVE',
    //       kind: 'NETFLIX',
    //       createdAt: 1568608359,
    //       updatedAt: 1568608359,
    //       images: {
    //         square:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-netflix-1x1.png",
    //         landscape:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-netflix-16x9.png"
    //       },
    //       dollar_value: 10
    //     },
    //     { id: '4',
    //       status: 'ACTIVE',
    //       kind: 'AIRBNB',
    //       createdAt: 1568608359,
    //       updatedAt: 1568608359,
    //       images: {
    //         square:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-airbnb-1x1.png",
    //         landscape:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-airbnb-16x9.png"
    //       },
    //       dollar_value: 10
    //     },
    //     { id: '5',
    //       status: 'ACTIVE',
    //       kind: 'CREATOR_PARTNERS',
    //       createdAt: 1568608359,
    //       updatedAt: 1568608359,
    //       images: {
    //         square:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-creator-partners-1x1-.png",
    //         landscape:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-creator-partners-16x9-.png"
    //       },
    //       dollar_value: 10
    //     },
    //     { id: '6',
    //       status: 'ACTIVE',
    //       kind: 'UBER',
    //       createdAt: 1568608359,
    //       updatedAt: 1568608359,
    //       images: {
    //         square:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-uber-1x1.png",
    //         landscape:"https://d3attjoi5jlede.cloudfront.net/images/web/redemption/redemption-uber-16x9.png"
    //       },
    //       dollar_value: 10
    //     } ],
    //   balance: { user_id: 'ca9cd73b-c79e-4d0b-b55b-6d95ee7a8d54',
    //     total_balance: '1748840000000000000000',
    //     available_balance: '1748840000000000000000',
    //     unsettled_debit: '0',
    //     updated_timestamp: 1568311829 },
    //   balance_in_higer_unit: '123',
    //   price_points: {
    //     OST: {
    //       USD: "0.0109763064",
    //       EUR: "0.0099645654",
    //       GBP: "0.0088206916",
    //       decimals: 18
    //     }
    //   }
    // };
    //
    // return responseHelper.successWithData(r);

    let redemptionProductsRsp = await new RedemptionProductsCache().fetch();
    if (redemptionProductsRsp.isFailure()) {
      return Promise.reject(redemptionProductsRsp);
    }

    // Filter out inactive products
    const allRedemptionProducts = redemptionProductsRsp.data['products'],
      activeRedemptionProducts = [];
    for(let index=0; index < allRedemptionProducts.length; index++) {
      if (allRedemptionProducts[index].status === redemptionConstants.activeStatus) {
        activeRedemptionProducts.push(allRedemptionProducts[index]);
      }
    }

    let getUserBalanceResponse = await new GetUserBalance({ user_id: oThis.currentUser.id }).perform();

    let getPepocornBalanceRsp = await new GetPepocornBalance({ userIds: [oThis.currentUser.id] }).perform();

    await oThis._fetchPricePoints();

    return Promise.resolve(
      responseHelper.successWithData({
        redemption_products: activeRedemptionProducts,
        balance: getUserBalanceResponse.data.balance,
        pepocorn_balance: getPepocornBalanceRsp[oThis.currentUser.id].balance,
        price_points: oThis.pricePoints
      })
    );
  }

  /**
   * Fetch price points.
   *
   * @returns {Promise<void>}
   * @private
   */
  async _fetchPricePoints() {
    const oThis = this;

    const pricePointsCacheRsp = await new PricePointsCache().fetch();

    if (pricePointsCacheRsp.isFailure()) {
      return Promise.reject(pricePointsCacheRsp);
    }

    oThis.pricePoints = pricePointsCacheRsp.data;
  }
}

module.exports = GetRedemptionInfo;
