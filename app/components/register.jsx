import React from 'react';

// Utils
import auth from '../lib/auth';
import api from '../lib/api';

// Components
import {Navigation} from 'react-router';
import InputTextFloatLabel from './partials/input-text-float-label';

export default React.createClass({
  displayName: 'Register',

  propTypes: {
  },

  mixins: [Navigation],

  statics: {
    willTransitionTo(transition) {
      if (auth.isLoggedIn()) {
        transition.redirect('/');
      }
    },
  },

  getInitialState() {
    return {
      email: null,
      message: null,
      error: false,
      disabled: false,
    };
  },

  // Handlers

  onChangeEmail(e) {
    e.preventDefault();
    this.setState({
      email: e.target.value,
    });
  },

  onRegister(e) {
    e.preventDefault();
    this.setState({
      disabled: true,
      error: false,
      message: null,
    });

    return api.register(this.state.email, this.state.password).then((user) => {
      this.transitionTo('/');
    }).catch((err) => {
      this.setState({
        disabled: false,
        error: true,
        message: err.message,
      });
    });
  },

  // Render

  getMessage() {
    if (!this.state.error) {
      return null;
    }

    return <div className="Login-message Login-message--error">{this.state.message}</div>;
  },

  render() {
    return (
      <article>
        <form>
          <section>
            <div className="row">
              <div className="col-xs-12">
                <fieldset className="form-group">
                  <InputTextFloatLabel
                    type="text"
                    label="Email"
                    value={this.state.email}
                    placeholder="Email"
                    onChange={this.onChangeEmail}
                    disabled={this.state.disabled}
                  />
                </fieldset>
              </div>
            </div>

            <div className="Login--submit row">
              <div className="col-xs-12">
                {this.getMessage()}
                <button
                  type="submit"
                  className="btn btn-success"
                  onClick={this.onRegister}
                  disabled={this.state.disabled}
                >Sign Up</button>
              </div>
            </div>
          </section>
        </form>
      </article>
    );
  },
});