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

  get minUserContributionPageSize() {
    return 1;
  }

  get minTagListPageSize() {
    return 1;
  }

  get minInviteUserSearchPageSize() {
    return 10;
  }

  get minInvitedUserSearchPageSize() {
    return 1;
  }

  get minVideoListPageSize() {
    return 1;
  }

  get minUserReplyListPageSize() {
    return 1;
  }

  get minUserSearchPageSize() {
    return 1;
  }

  get minAdminUserSearchPageSize() {
    return 1;
  }

  get minChannelVideoListPageSize() {
    return 1;
  }

  get maxChannelVideoListPageSize() {
    return 20;
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

  get maxUserReplyListPageSize() {
    return 21;
  }

  get maxUserSearchPageSize() {
    return 20;
  }

  get maxAdminUserSearchPageSize() {
    return 50;
  }

  get maxInviteUserSearchPageSize() {
    return 100;
  }

  get maxInvitedUserSearchPageSize() {
    return 20;
  }

  get defaultUserContributionPageSize() {
    return 20;
  }

  get defaultUserNotificationPageSize() {
    return 20;
  }

  get defaultTagListPageSize() {
    return 20;
  }

  get defaultVideoListPageSize() {
    return 20;
  }

  get defaultUserReplyListPageSize() {
    return 20;
  }

  get defaultUserSearchPageSize() {
    return 20;
  }

  get defaultAdminUserSearchPageSize() {
    return 50;
  }

  get defaultInvitedUserSearchPageSize() {
    return 10;
  }

  get defaultInviteUserSearchPageSize() {
    return 50;
  }

  get defaultChannelVideoListPageSize() {
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
