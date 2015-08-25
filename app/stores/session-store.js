/**
 * This Store contains data for Car.
 */

import _ from 'lodash';
import BaseStore from './base-store';

// Store
class SessionStore extends BaseStore {
  defaults() {
    return {};
  }

  // Constructor
  constructor() {
    super();

    this.storeName = 'session';
  }
}

// EXPORT
export default SessionStore;
