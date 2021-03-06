const _ = require('lodash');
const request = require('../../lib/request');
const Muni = require('muni');

module.exports = {
  auth: Muni.Promise.method((user) => {
    const bmw = user.get('bmw');
    const nowTime = new Date().getTime();

    // Token is not expired, reuse it
    if (bmw.expires_at > nowTime) {
      return bmw;
    }

    // Token is expired, refresh it
    return request({
      method: 'POST',
      url: 'https://b2vapi.bmwgroup.us/webapi/oauth/token',
      headers: {
        Authorization: `Basic ${nconf.get('BMW_BASIC_AUTH')}`,
      },
      form: {
        grant_type: 'refresh_token',
        refresh_token: bmw.refresh_token,
        scope: 'remote_services vehicle_data',
      },
    }).then((newBmw) => {
      // Update `expires_at` using `expires_in` (minus 5 minutes)
      newBmw.expires_at = nowTime + (newBmw.expires_in * 1000) - 300000;
      newBmw.vin = bmw.vin;

      // Update user with new auth newBmw
      user.set('bmw', newBmw);
      return user.save().return(newBmw);
    });
  }),

  /**
   * Get car vehicle data
   */
  sendVehicleRequest: Muni.Promise.method(function(accessToken, vin) {
    return request({
      url: `https://b2vapi.bmwgroup.us/webapi/v1/user/vehicles/${vin}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }),

  /**
   * Check the status of the car
   */
  sendStatusRequest: Muni.Promise.method(function(accessToken, vin) {
    return request({
      url: `https://b2vapi.bmwgroup.us/webapi/v1/user/vehicles/${vin}/status`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }),

  /**
   * Get car driving statistics
   */
  sendStatisticsRequest: Muni.Promise.method(function(accessToken, vin, filter) {
    filter = _.isString(filter) ? filter : 'allTrips';
    return request({
      url: `https://b2vapi.bmwgroup.us/webapi/v1/user/vehicles/${vin}/statistics/${filter}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }),

  /**
   * Get car destinations
   */
  sendDestinationsRequest: Muni.Promise.method(function(accessToken, vin) {
    return request({
      url: `https://b2vapi.bmwgroup.us/webapi/v1/user/vehicles/${vin}/destinations`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }),

  /**
   * Get car charging profile
   */
  sendChargingProfileRequest: Muni.Promise.method(function(accessToken, vin) {
    return request({
      url: `https://b2vapi.bmwgroup.us/webapi/v1/user/vehicles/${vin}/chargingprofile`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }),

  /**
   * Get car range map
   */
  sendRangeMapRequest: Muni.Promise.method(function(accessToken, vin) {
    return request({
      url: `https://b2vapi.bmwgroup.us/webapi/v1/user/vehicles/${vin}/rangemap`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }),

  /**
   * Execute a remote service on the car
   *
   * type:
   * - DOOR_LOCK
   * - ???
   */
  sendExecuteServiceRequest: Muni.Promise.method(function(accessToken, vin, type) {
    if (!type) {
      throw new Error('Missing `type`.');
    }

    return request({
      method: 'POST',
      url: `https://b2vapi.bmwgroup.us/webapi/v1/user/vehicles/${vin}/executeService`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      form: {
        serviceType: type,
      },
    });
  }),


  /**
   * Send POI to car
   *
   * Properties:
   * - street
   * - city
   * - country
   * - lon (optional)
   * - lat (optional)
   * - name (optional)
   * - subject (optional)
   */
  sendPOIRequest: Muni.Promise.method(function(accessToken, vin, poi) {
    if (!poi.street || !poi.city || !poi.country) {
      throw new Error('Missing `street`, `city`, or `country`.');
    }

    const data = {
      poi: _.defaults(poi, {
        // subject: 'SID_MYBMW_MAP_DROPPED_PIN_TITLE',
        useAsDestination: true,
        name: poi.street,
      }),
    };

    return request({
      method: 'POST',
      url: `https://b2vapi.bmwgroup.us/webapi/v1/user/vehicles/${vin}/sendpoi`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      form: {
        data: JSON.stringify(data),
      },
    });
  }),
};
