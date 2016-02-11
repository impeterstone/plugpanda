import React from 'react';

// Utils
import api from '../lib/api';

// Store
import store from '../stores/store';

// Components
import InputTextFloatLabel from './partials/input-text-float-label';

export default React.createClass({
  displayName: 'Login',

  propTypes: {
    history: React.PropTypes.object,
  },

  getInitialState() {
    return {
      email: null,
      password: null,
      message: null,
      error: false,
      disabled: false,
    };
  },

  componentDidMount() {
    store.dispatch({
      type: 'NAV_TITLE',
      data: 'Sign In',
    });
  },

  componentWillUnmount() {
    store.dispatch({
      type: 'NAV_TITLE',
    });
  },

  // Handlers

  onChangeEmail(event) {
    event.preventDefault();
    this.setState({
      email: event.target.value,
    });
  },

  onChangePassword(event) {
    event.preventDefault();
    this.setState({
      password: event.target.value,
    });
  },

  onLogin(event) {
    event.preventDefault();
    this.setState({
      disabled: true,
      error: false,
      message: null,
    });

    // Start loading
    store.dispatch({
      type: 'NAV_LOADING',
      data: true,
    });

    return api.login(this.state.email, this.state.password).finally(() => {
      // Stop loading
      store.dispatch({
        type: 'NAV_LOADING',
        data: false,
      });
    }).then(() => {
      this.props.history.push('/dashboard');
      return null;
    }).catch((err) => {
      this.setState({
        disabled: false,
        error: true,
        message: err.message,
      });
    });
  },

  onRegister(event) {
    event.preventDefault();
    this.props.history.push('/register');
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
      <form>
        <section>
          <div className="row">
            <div className="col-xs-12">
              <fieldset className="form-group">
                <InputTextFloatLabel
                  type="email"
                  label="Email"
                  value={this.state.email}
                  placeholder="Email"
                  onChange={this.onChangeEmail}
                  disabled={this.state.disabled}
                />
              </fieldset>
            </div>
          </div>

          <div className="row">
            <div className="col-xs-12">
              <fieldset className="form-group">
                <InputTextFloatLabel
                  type="password"
                  label="Password"
                  value={this.state.password}
                  placeholder="Password"
                  onChange={this.onChangePassword}
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
                className="btn btn-primary"
                onClick={this.onLogin}
                disabled={this.state.disabled}
              >Sign In</button>
              &nbsp;&nbsp;or&nbsp;&nbsp;
              <span className="Login-register" onClick={this.onRegister}>Sign up for a new account</span>
            </div>
          </div>
        </section>
      </form>
    );
  },
});
