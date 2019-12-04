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
      u_id: 'uid',
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
  get registerUserEntityType() {
    return 'register_user';
  }

  get accountUpdateEntityType() {
    return 'account_update';
  }
  // Entity types end.

  // Entity actions start.
  get registerUserEntityAction() {
    return 'register_user';
  }
  // Entity actions end.

  // Page types start.
  get registerUserPageType() {
    return 'register_user';
  }
  // Page types end.

  get mandatoryKeys() {
    return ['e_entity', 'e_action', 'p_type'];
  }

  get pixelUserAgent() {
    return 'pepo_api_backend';
  }
}

module.exports = new PixelConstants();
