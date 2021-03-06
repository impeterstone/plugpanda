const _ = require('lodash');
const bcrypt = require('bcrypt');
const Muni = require('muni');
const Chance = require('chance');
const chance = new Chance();
const chargepoint = require('../lib/chargepoint');
const Mailgun = require('mailgun').Mailgun;
const mailgun = Muni.Promise.promisifyAll(new Mailgun(nconf.get('MAILGUN_KEY')));

const BaseModel = require('./base');

module.exports = BaseModel.extend({
  urlRoot: 'users',

  definition: function() {
    return _.assign({},
      _.result(BaseModel.prototype, 'definition'), {
        // Reserved fields
        access_token: {
          type: 'string',
          readonly: true,
        },
        secret: {
          type: 'string',
          readonly: true,
          hidden: true,
          default: function() {
            return Muni.randomHash();
          },
        },
        salt: {
          type: 'string',
          readonly: true,
          hidden: true,
          default: function() {
            return bcrypt.genSaltSync(10);
          },
        },
        hash: {
          type: 'string',
          readonly: true,
          hidden: true,
        },
        features: {
          type: 'object',
          fields: {
            admin: {
              type: 'boolean',
              default: false,
            },
            readonly: {
              type: 'boolean',
              default: false,
            },
            waitlisted: {
              type: 'boolean',
              default: true,
            },
            bmw: {
              type: 'boolean',
              default: false,
            },
            chargepoint: {
              type: 'boolean',
              default: false,
            },
            getaround: {
              type: 'boolean',
              default: false,
            },
          },
        },
        flags: {
          type: 'object',
          fields: {
            auto_stop: {
              type: 'boolean',
              default: true,
            },
          },
        },

        // Basic
        email: {
          type: 'string',
        },
        name: {
          type: 'string',
        },
        currency: {
          type: 'string',
          default: 'usd',
        },
        timezone: {
          type: 'string',
          default: 'utc',
        },
        country: {
          type: 'string',
          default: 'us',
        },
        phone: {
          type: 'string',
        },

        // Waitlist
        waitlisted_date: {
          type: 'date',
        },

        // Billing
        plan: {
          type: 'string',
          default: 'free',
        },
        stripe: {
          type: 'object',
          fields: {
            customer: {
              type: 'string',
            },
            subscription: {
              type: 'string',
            },
          },
        },

        // Bmw
        bmw: {
          type: 'object',
          fields: {
            access_token: {
              type: 'string',
            },
            token_type: {
              type: 'string',
              default: 'Bearer',
            },
            refresh_token: {
              type: 'string',
            },
            scope: {
              type: 'string',
            },
            vin: {
              type: 'string',
            },
            expires_in: {
              type: 'uinteger',
              default: 28800,
            },
            expires_at: {
              type: 'uinteger',
            },
          },
        },

        // Chargepoint
        chargepoint: {
          type: 'object',
          fields: {
            user_id: {
              type: 'uinteger',
            },
            auth_token: {
              type: 'string',
            },
          },
        },

        // Getaround
        getaround: {
          type: 'object',
          fields: {
            device_tracking_id: {
              type: 'string',
            },
            session_id: {
              type: 'string',
            },
          },
        },
      }
    );
  },

  validate() {
    if (!this.get('email')) {
      return new Muni.Error('User requires an email.', 400);
    }

    return null;
  },

  setFromRequest: Muni.Promise.method(function(body) {
    return Muni.Promise.bind(this).then(function() {
      return this._validateEmail(body);
    }).then(function() {
      return this._validatePassword(body);
    }).then(function() {
      return BaseModel.prototype.setFromRequest.call(this, body);
    });
  }),

  _validateEmail: Muni.Promise.method(function(body) {
    const email = Muni.sanitizeEmail(body.email);
    if (!email) {
      return body;
    }

    // Sanitize and Validate
    if (!Muni.isValidEmail(email)) {
      throw new Muni.Error('Invalid `email` provided.', 400);
    }

    body.email = email;
    return body;
  }),

  // Validate and sanitize passwords
  _validatePassword: Muni.Promise.method(function(body) {
    const password = _.trim(body.password);

    if (!password) {
      return body;
    }

    if (password.length < 8) {
      throw new Muni.Error('Password must be at least 8 characters long.', 400);
    }

    body.password = password;
    return body;
  }),

  setPassword(password) {
    if (!password) {
      return this;
    }

    const hash = this.hashPassword(password, this.get('salt'));
    this.set('hash', hash);

    return this;
  },

  // Convert plain text password into a hash
  hashPassword(password, salt) {
    return bcrypt.hashSync(password, salt);
  },

  // Generate a random password
  generateRandomPassword() {
    return chance.string({
      length: 8,
      pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*',
    });
  },

  // Generates an access token using a random hash
  generateAccessToken() {
    return Muni.randomHash();
  },

  // Generate a reset password token (expires in 24 hours)
  generateResetToken() {
    const token = {
      email: this.get('email'),
      expires: (new Date()).getTime() + 86400000,
    };
    return Muni.encryptString(JSON.stringify(token), 'aes256', nconf.get('CLIENT_TOKEN'));
  },

  decryptResetToken(resetToken) {
    try {
      return JSON.parse(Muni.decryptString(resetToken, 'aes256', nconf.get('CLIENT_TOKEN')));
    } catch (err) {
      return null;
    }
  },

  // Checks for expiration date
  // Expects `token` to be an Object
  isResetTokenValid(token) {
    if (_.isObject(token)) {
      return token.expires >= (new Date().getTime());
    }
    return false;
  },

  sendResetPasswordEmail() {
    const resetToken = this.generateResetToken();
    const resetUrl = `${nconf.get('HOST')}/reset_password?token=${resetToken}`;

    return mailgun.sendTextAsync(
      'noreply@plugpanda.com',
      this.get('email'),
      'Reset Your Password',
      resetUrl
    ).return(this);
  },

  getWaitlistPosition() {
    return this.db.count('users', {
      waitlisted_date: {
        $lt: this.get('waitlisted_date'),
      },
      'features.waitlisted': true,
    }).then((count) => {
      return count + 1;
    });
  },

  // Login to Chargepoint and get `user_id` and `auth_token`
  authenticateChargepoint(email, password) {
    return chargepoint.sendLoginRequest(email, password).tap((login) => {
      const userId = _.parseInt(login.user_id);
      const authToken = login.auth_token;

      if (!userId || !authToken) {
        throw new Error('Invalid Chargepoint Response.');
      }

      this.set('chargepoint', {
        user_id: userId,
        auth_token: authToken,
      });
    }).return(this);
  },

  // Return name parsed from email
  _usernameFromEmail(email) {
    const matches = /[(\W|^)[\w.+\-]{0,25}(?=@)/.exec(email);
    return _.head(matches);
  },

  // Get the prepended country phone code
  // For use with Twilio
  phoneCode() {
    let code;

    switch (this.get('country')) {
      case 'us':
        code = '+1';
        break;
      default:
        code = '+1';
        break;
    }

    return code;
  },

  shouldAutoStop() {
    return !!this.get('flags.auto_stop');
  },

  beforeSave: Muni.Promise.method(function() {
    // If name is not provided, extract it from email
    if (!this.get('name')) {
      this.set('name', this._usernameFromEmail(this.get('email')));
    }

    return BaseModel.prototype.beforeSave.apply(this, arguments);
  }),

  save: Muni.Promise.method(function() {
    return BaseModel.prototype.save.apply(
      this,
      arguments
    ).bind(this).catch(function(err) {
      // Catch the mongodb `11000` error code, which is a duplicate index error
      if (err && err.message && /E11000/.test(err.message)) {
        // Duplicate key error
        throw new Muni.Error('User with email already exists.', 409);
      } else {
        // Some other error, just bubble it up
        throw new Muni.Error(err.message, 500);
      }
    });
  }),
});
