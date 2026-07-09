// src/views/UpdateAlertsDemandView.jsx

import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { updateAlertsDemand } from '../actions/syncActions';
import { useParams } from 'react-router-dom';

/**
 * UpdateAlertsDemandView component to handle the PATCH request for updating alerts demand details.
 *
 * @returns {React.FC} - The UpdateAlertsDemandView component
 */
const UpdateAlertsDemandView: React.FC = () => {
  const dispatch = useDispatch();
  const { id } = useParams<{ id: string }>();
  const alertsDemand = useSelector((state) => state.company.alertsDemands.find((demand) => demand.id === id));

  if (!alertsDemand) {
    return <div>Alerts Demand not found</div>;
  }

  // Define validation schema using Yup
  const validationSchema = Yup.object({
    quantity: Yup.number().required('Quantity is required'),
    urgency: Yup.string()
      .oneOf(['low', 'medium', 'high'], 'Urgency must be low, medium, or high')
      .required('Urgency is required'),
  });

  // Initialize Formik form
  const formik = useFormik({
    initialValues: {
      quantity: alertsDemand.quantity,
      urgency: alertsDemand.urgency,
    },
    validationSchema,
    onSubmit: (values) => {
      dispatch(updateAlertsDemand(id, values));
    },
  });

  return (
    <div>
      <h1>Update Alerts Demand</h1>
      <form onSubmit={formik.handleSubmit}>
        <div>
          <label htmlFor="quantity">Quantity:</label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            value={formik.values.quantity}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />
          {formik.touched.quantity && formik.errors.quantity ? (
            <div>{formik.errors.quantity}</div>
          ) : null}
        </div>
        <div>
          <label htmlFor="urgency">Urgency:</label>
          <select
            id="urgency"
            name="urgency"
            value={formik.values.urgency}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            <option value="">Select urgency</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {formik.touched.urgency && formik.errors.urgency ? (
            <div>{formik.errors.urgency}</div>
          ) : null}
        </div>
        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default UpdateAlertsDemandView;