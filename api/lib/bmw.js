const request = require('./request');
const Muni = require('muni');

module.exports = {
  auth: Muni.Promise.method((_id = '55d6ce9d3f6ba1006100005d') => {
    return db.findOne('bmws', {
      _id: _id,
    }).then((bmw) => {
      const nowTime = new Date().getTime();

      // Token is not expired, reuse it
      if (bmw.expires_at > nowTime) {
        return bmw;
      }

      // Token is expired, refresh it
      return request.send({
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
      }).then((data) => {
        // Update `expires_at` using `expires_in`
        data.expires_at = nowTime + (data.expires_in * 1000);

        // Update db with new auth data
        return db.findAndModify('bmws', {
          _id: '55d6ce9d3f6ba1006100005d',
        }, {
          $set: data,
        });
      });
    });
  }),
};