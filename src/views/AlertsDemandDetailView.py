// src/views/AlertsDemandDetailView.js

import React from 'react';
import { connect } from 'react-redux';
import * as actions from '../actions/syncActions';
import AlertsDemand from '../models/AlertsDemand';

/**
 * Component to display detailed information about an alerts demand.
 *
 * @param {Object} props - The component props.
 * @param {number} props.match.params.pk - The primary key of the alerts demand.
 * @returns {JSX.Element} - The JSX element representing the Alerts Demand Detail View.
 */
const AlertsDemandDetailView = ({ match, fetchAlertsDemand }) => {
  const pk = parseInt(match.params.pk, 10);
  const [alertsDemand, setAlertsDemand] = React.useState(null);

  React.useEffect(() => {
    const loadAlertsDemand = async () => {
      try {
        const response = await fetchAlertsDemand(pk);
        setAlertsDemand(response.data);
      } catch (error) {
        console.error('Failed to load alerts demand:', error);
      }
    };

    if (!alertsDemand) {
      loadAlertsDemand();
    }
  }, [pk, fetchAlertsDemand, alertsDemand]);

  if (!alertsDemand) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Alerts Demand Detail</h1>
      <pre>{JSON.stringify(alertsDemand, null, 2)}</pre>
    </div>
  );
};

/**
 * Maps the state to component props.
 *
 * @param {Object} state - The application state.
 * @returns {Object} - The mapped props.
 */
const mapStateToProps = (state) => ({
  alertsDemands: state.alertsDemands,
});

/**
 * Maps dispatch functions to component props.
 *
 * @param {Function} dispatch - The dispatch function.
 * @returns {Object} - The mapped dispatch functions.
 */
const mapDispatchToProps = {
  fetchAlertsDemand: actions.fetchAlertsDemand,
};

export default connect(mapStateToProps, mapDispatchToProps)(AlertsDemandDetailView);