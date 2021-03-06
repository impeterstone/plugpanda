const _ = require('lodash');
const Muni = require('muni');
const BaseController = require('./base');

const authenticateWorkerMiddleware = require('../middleware/authenticate-worker');

const IronWorker = require('iron_worker');
const ironWorker = new IronWorker.Client({
  project_id: nconf.get('IRON_PROJECT_ID'),
  token: nconf.get('IRON_TOKEN'),
});
const createTask = Muni.Promise.promisify(ironWorker.tasksCreate, {
  context: ironWorker,
});

module.exports = BaseController.extend({
  setupRoutes() {
    BaseController.prototype.setupRoutes.call(this);

    // Polled by an iron worker every 3 minutes
    this.routes.get['/workers/chargepoint'] = {
      action: this.chargepoint,
      middleware: [authenticateWorkerMiddleware],
    };
  },

  // 1. Fetch a list of all users who have `chargepoint` configured
  // 2. Fire one-off jobs for each user to update session status
  chargepoint(req, res, next) {
    this.get('db').find('users', {
      'features.readonly': {
        $ne: true,
      },
      'chargepoint.user_id': {
        $ne: 0,
      },
      'chargepoint.auth_token': {
        $ne: null,
      },
    }, {
      fields: {
        access_token: 1,
      },
    }).then((result) => {
      const users = _.head(result);
      const userIds = _.map(users, '_id');
      const accessTokens = _.map(users, 'access_token');

      // Fire off the jobs
      const promises = [];
      _.forEach(accessTokens, function(accessToken) {
        promises.push(createTask('session', {
          method: 'GET',
          url: `${nconf.get('HOST')}/api/session/status`,
          access_token: accessToken,
        }, {
          priority: 2,
          delay: 0,
        }));

        promises.push(createTask('session', {
          method: 'GET',
          url: `${nconf.get('HOST')}/api/session/outdated`,
          access_token: accessToken,
        }, {
          priority: 2,
          delay: 0,
        }));
      });

      return Muni.Promise.all(promises).return(userIds);
    }).then((userIds) => {
      res.data = userIds;
      next();
    }).catch(next);
  },
});
