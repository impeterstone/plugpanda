// import _ from 'lodash';
import React from 'react';

// Components

export default React.createClass({
  displayName: 'Loading',

  propTypes: {
    params: React.PropTypes.object,
  },

  // Render

  render() {
    return (
      <div>
        <section>Loading...</section>
      </div>
    );
  },
});
