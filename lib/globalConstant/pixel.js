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
      e_entity: 'ee',
      e_action: 'ea',
      p_type: 'pt',
      p_name: 'pn',
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
  get accountUpdateEntityType() {
    return 'account_update';
  }
  // Entity types end.

  get mandatoryKeys() {
    return ['e_entity', 'e_action', 'p_type'];
  }

  get pixelUserAgent() {
    return 'pepo_admin_backend';
  }

  get userApprovedViaSlackChannelMedium() {
    return 'slack_channel';
  }

  get userApprovedViaAdminUserProfileMedium() {
    return 'admin_user_profile';
  }
}

module.exports = new PixelConstants();
