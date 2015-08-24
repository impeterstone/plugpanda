import _ from 'lodash';
import React from 'react';

// API
import api from '../lib/api';

// Store and Actions
import CarStore from '../stores/car-store';
import CarActions from '../actions/car-actions';
const carStore = new CarStore();

// Components
// import {Link} from 'react-router';

import moment from 'moment';

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
    return carStore.getState();
  },

  componentDidMount() {
    carStore.addChangeListener(this.onChange);
  },

  componentWillUnmount() {
    carStore.removeChangeListener(this.onChange);
  },

  // Handlers

  onChange() {
    this.setState(carStore.getState());
  },

  // Render

  render() {
    const fuelPercent = ((this.state.maxFuel / this.state.remainingFuel) * 100).toFixed(0);

    const mapUrl = this._buildStaticMap(this.state.position);

    return (
      <div className="Section container-fluid">
        <h2>VIN: {this.state.vin}</h2>

        <div>
          <p>Last Updated: {moment(this.state.updateTime).fromNow()}</p>
        </div>

        <div>
          <p>Miles: {this.state.miles}</p>
        </div>

        <div>
          <p>Lock: {this.state.doorLockState}</p>
          <p>Driver Front: {this.state.doorDriverFront}</p>
          <p>Driver Rear: {this.state.doorDriverRear}</p>
          <p>Passenger Front: {this.state.doorPassengerFront}</p>
          <p>Passenger Rear: {this.state.doorPassengerRear}</p>
          <p>Trunk {this.state.trunk}</p>
          <p>Frunk {this.state.hood}</p>
        </div>

        <div>
          <p>Battery: {this.state.chargingLevelHv}%</p>
          <p>Fuel: {fuelPercent}%</p>
          <p>Charging Status: {this.state.chargingStatus}</p>
          <p>Port Status: {this.state.connectionStatus}</p>
        </div>

        <div>
          <img className="Car-map" src={mapUrl} />
        </div>
      </div>
    );
  },

  _buildStaticMap(position, zoom = 16, size = '400x400') {
    const lat = position.lat;
    const lon = position.lon;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${size}&markers=${lat},${lon}`;
  },
});
