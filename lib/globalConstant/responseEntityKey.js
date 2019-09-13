/**
 * Class for response entity keys.
 *
 * @class ResponseEntityKey
 */
class ResponseEntityKey {
  get loggedInUser() {
    return 'logged_in_user';
  }

  get loggedInAdmin() {
    return 'logged_in_admin';
  }

  get gifs() {
    return 'gifs';
  }

  get gifCategories() {
    return 'gif_categories';
  }

  get token() {
    return 'token';
  }

  get device() {
    return 'device';
  }

  get recoveryInfo() {
    return 'recovery_info';
  }

  get users() {
    return 'users';
  }

  get user() {
    return 'user';
  }

  get contributionToUsers() {
    return 'contribution_to_users';
  }

  get userContributionToStats() {
    return 'user_contribution_to_stats';
  }

  get contributionByUsers() {
    return 'contribution_by_users';
  }

  get userContributionByStats() {
    return 'user_contribution_by_stats';
  }

  get contributionSuggestions() {
    return 'contribution_suggestions';
  }

  get meta() {
    return 'meta';
  }

  get ostTransaction() {
    return 'ost_transaction';
  }

  get feed() {
    return 'feed';
  }

  get feedsList() {
    return 'feeds';
  }

  get userVideoList() {
    return 'user_videos';
  }

  get searchResults() {
    return 'search_results';
  }

  get userFeed() {
    return 'user_feed';
  }

  get userNotification() {
    return 'user_notification';
  }

  get userNotificationList() {
    return 'user_notifications';
  }

  get uploadParams() {
    return 'upload_params';
  }

  get userProfile() {
    return 'user_profile';
  }

  get userProfiles() {
    return 'user_profiles';
  }

  get links() {
    return 'links';
  }

  get videos() {
    return 'videos';
  }

  get images() {
    return 'images';
  }

  get bio() {
    return 'bio';
  }

  get tags() {
    return 'tags';
  }

  get userProfileAllowedActions() {
    return 'user_profile_allowed_actions';
  }

  get userStats() {
    return 'user_stats';
  }

  get videoDetails() {
    return 'video_details';
  }

  get currentUserUserContributions() {
    return 'current_user_user_contributions';
  }

  get currentUserVideoContributions() {
    return 'current_user_video_contributions';
  }

  get pricePoints() {
    return 'price_points';
  }

  get websocketConnectionPayload() {
    return 'websocket_connection_payload';
  }

  get launchInviteSearchResults() {
    return 'launch_invite_search_results';
  }

  get invites() {
    return 'invites';
  }

  get videoDescriptions() {
    return 'video_descriptions';
  }

  get share() {
    return 'share';
  }

  get goto() {
    return 'goto';
  }
}

module.exports = new ResponseEntityKey();
