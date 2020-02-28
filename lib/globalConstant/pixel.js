// Declare variables.
let timezoneOffset;

/**
 * Class for pixel constants.
 *
 * @class PixelConstants
 */
class PixelConstants {
  get longToShortNameKeysMap() {
    return {
      t_version: 'v',
      t_gid: 'tid',
      user_id: 'uid',
      u_service_id: 'serid',
      u_session_id: 'sesid',
      u_timezone: 'tz',
      entity_type: 'ee',
      entity_action: 'ea',
      page_type: 'pt',
      page_name: 'pn',
      p_referer_loc: 'ref',
      device_id: 'did',
      device_type: 'dt',
      device_platform: 'dp',
      device_resolution: 'dr',
      device_model: 'dm',
      device_os: 'dos',
      device_language: 'dl',
      device_width: 'dw',
      device_height: 'dh',
      user_agent: 'ua',
      e_data_json: 'ed'
    };
  }

  // Entity types start.
  get userEntityType() {
    return 'user';
  }
  // Entity types end.

  // Entity actions start.
  get creatorApprovedEntityAction() {
    return 'creator_approved';
  }
  // Entity actions end.

  get userApprovedViaSlackChannelMedium() {
    return 'slack_channel';
  }

  get userApprovedViaSignupAutoApprovalMedium() {
    return 'admin_auto_approval';
  }

  get userApprovedViaAdminUserProfileMedium() {
    return 'admin_user_profile';
  }

  getPixelIdentifierKey(entityType, entityAction) {
    return `${entityType}-${entityAction}`;
  }

  // Default variable values starts here.
  get pixelUserAgent() {
    return 'pepo_admin_backend';
  }

  get timezoneOffset() {
    timezoneOffset = timezoneOffset || new Date().getTimezoneOffset();

    return timezoneOffset;
  }
  // Default variable values ends here.
}

module.exports = new PixelConstants();
