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

  get maxUserContributionPageSize() {
    return 20;
  }

  get maxTagListPageSize() {
    return 20;
  }

  get maxVideoListPageSize() {
    return 21;
  }

  get defaultUserContributionPageSize() {
    return 20;
  }

  get defaultUserNotificationPageSize() {
    return 20;
  }

  get defaultTagListPageSize() {
    return 10;
  }

  get defaultVideoListPageSize() {
    return 21;
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
