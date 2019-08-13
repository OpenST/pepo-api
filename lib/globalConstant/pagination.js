/**
 * Module for pagination related global constants.
 *
 * @module lib/globalConstant/pagination
 */

/**
 * Class for pagination related global constants.
 *
 * @class Pagination
 */
class Pagination {
  get paginationIdentifierKey() {
    return 'pagination_identifier';
  }

  get nextPagePayloadKey() {
    return 'next_page_payload';
  }

  get totalNoKey() {
    return 'total_no';
  }

  get hasNextPage() {
    return 'has_next_page';
  }

  get minUserContributionPageSize() {
    return 1;
  }

  get minTagListPageSize() {
    return 1;
  }

  get minVideoListPageSize() {
    return 1;
  }

  get minUserSearchPageSize() {
    return 1;
  }

  get maxUserContributionPageSize() {
    return 20;
  }

  get maxTagListPageSize() {
    return 20;
  }
  get maxVideoListPageSize() {
    return 21;
  }

  get maxUserSearchPageSize() {
    return 20;
  }

  get defaultUserContributionPageSize() {
    return 20;
  }

  get defaultTagListPageSize() {
    return 10;
  }

  get defaultVideoListPageSize() {
    return 21;
  }

  get defaultUserSearchPageSize() {
    return 10;
  }

  get minUserActivityPageSize() {
    return 1;
  }

  get maxUserActivityPageSize() {
    return 10;
  }

  get defaultUserActivityPageSize() {
    return 10;
  }

  get minPublicActivityPageSize() {
    return 1;
  }

  get maxPublicActivityPageSize() {
    return 10;
  }

  get defaultPublicActivityPageSize() {
    return 10;
  }

  get defaultFeedsListPageSize() {
    return 10;
  }
  get minFeedsListPageSize() {
    return 1;
  }
  get maxFeedsListPageSize() {
    return 10;
  }
}

module.exports = new Pagination();
