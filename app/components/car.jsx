import _ from 'lodash';
import React from 'react';

// API
import api from '../lib/api';

// Store and Actions
import CarStore from '../stores/car-store';
import CarActions from '../actions/car-actions';

// Components
// import {Link} from 'react-router';

export default React.createClass({
  displayName: 'Car',

  statics: {
    // willTransitionTo(transition, params, query, callback) {
    //   // transition.redirect('root');
    //   callback();
    // },

    fetch(params, query) {
      return api.fetchCar().then((state) => {
        CarActions.sync(state);
      });
    },
  },

  getInitialState() {
    return CarStore.getState();
  },

  componentDidMount() {
    CarStore.addChangeListener(this.onChange);
  },

  componentWillUnmount() {
    CarStore.removeChangeListener(this.onChange);
  },

  // Handlers

  onChange() {
    this.setState(CarStore.getState());
  },

  // Render

  render() {
    const fuelPercent = ((this.state.maxFuel / this.state.remainingFuel) * 100).toFixed(0);

    return (
      <div className="Car">
        <h2>VIN: {this.state.vin}</h2>

        <div>
          <p>Miles: {this.state.miles}</p>
        </div>

        <div>
          <p>Battery: {this.state.chargingLevelHv}%</p>
          <p>Fuel: {fuelPercent}%</p>
          <p>Charging Status: {this.state.chargingStatus}</p>
          <p>Port Status: {this.state.connectionStatus}</p>
        </div>
      </div>
    );
  },
});