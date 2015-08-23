import _ from 'lodash';
import React from 'react';

// API
import api from '../lib/api';

// Store and Actions
import HistoryStore from '../stores/car-store';
import HistoryActions from '../actions/car-actions';

// Components
import {Link} from 'react-router';

export default React.createClass({
  displayName: 'History',

  statics: {
    // willTransitionTo(transition, params, query, callback) {
    //   // transition.redirect('root');
    //   callback();
    // },

    fetch(params, query) {
      return api.fetchHistory().then((sessions) => {
        HistoryActions.sync({
          sessions: sessions,
        });
      });
    },
  },

  getInitialState() {
    return HistoryStore.getState();
  },

  componentDidMount() {
    HistoryStore.addChangeListener(this.onChange);
  },

  componentWillUnmount() {
    HistoryStore.removeChangeListener(this.onChange);
  },

  // Handlers

  onChange() {
    this.setState(HistoryStore.getState());
  },

  // Render

  getSession(session, idx) {
    let displayTime;
    const chargingTime = (session.charging_time / 1000 / 60).toFixed(0);
    if (chargingTime >= 60) {
      const hours = Math.floor(chargingTime / 60);
      const minutes = chargingTime % 60;
      displayTime = `${hours} hours, ${minutes} minutes`;
    } else {
      displayTime = `${chargingTime} minutes`;
    }

    return (
      <tr key={idx}>
        <td><Link to="session_id" params={{session_id: session.session_id}}>{session.session_id}</Link></td>
        <td>{displayTime}</td>
        <td>{session.energy_kwh}</td>
        <td>{session.total_amount.toFixed(2)}</td>
      </tr>
    );
  },

  getSessions() {
    const sessions = this.state.sessions;

    // TODO
    if (!sessions || !sessions.length) {
      return (
        <div className="text-warning">No Sessions</div>
      );
    }

    return sessions.map(this.getSession);
  },

  render() {
    return (
      <div className="Section container-fluid">
        <div className="row">
          <div className="col-xs-12">
            <h2>History</h2>
          </div>
        </div>

        <div className="row">
          <div className="col-xs-12">
            <table className="table table-striped">
              <thead className="thead-default">
                <tr>
                  <th>Session</th>
                  <th>Duration</th>
                  <th>Energy (kW)</th>
                  <th>Cost ($)</th>
                </tr>
              </thead>

              <tbody>
                {this.getSessions()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  },
});
