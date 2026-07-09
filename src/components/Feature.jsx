import React from 'react';
import { Tabs, TabPane, Form, Input, Button, Upload, message } from 'antd';

const { Dragger } = Upload;

// Define constants for the tab keys
const TAB_COMPANY = 'company';
const TAB_BRANCHES = 'branches';
const TAB_INTEGRATIONS = 'integrations';

/**
 * Feature component to display a Settings page with three tabs: Company, Branches, and Integrations.
 *
 * @returns {React.FC} - The Feature component
 */
const Feature: React.FC = () => {
  const [activeKey, setActiveKey] = React.useState(TAB_COMPANY);

  /**
   * Handles tab change event.
   *
   * @param {string} key - The key of the active tab
   */
  const handleTabChange = (key: string) => {
    setActiveKey(key);
  };

  return (
    <Tabs defaultActiveKey={TAB_COMPANY} onChange={handleTabChange}>
      <TabPane tab="Company" key={TAB_COMPANY}>
        <Form layout="vertical">
          <Form.Item label="Name">
            <Input />
          </Form.Item>
          <Form.Item label="Registration Number">
            <Input />
          </Form.Item>
          <Form.Item label="Address">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="Logo Upload">
            <Dragger name="logo" action="/upload/logo">
              <p className="ant-upload-drag-icon">
                <inbox-outlined></inbox-outlined>
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files
              </p>
            </Dragger>
          </Form.Item>
        </Form>
      </TabPane>
      <TabPane tab="Branches" key={TAB_BRANCHES}>
        {/* Branch list and actions will be implemented here */}
      </TabPane>
      <TabPane tab="Integrations" key={TAB_INTEGRATIONS}>
        <h4>Shopify Connection</h4>
        {/* Shopify connection status and Connect/Disconnect button will be implemented here */}
        <br />
        <h4>WooCommerce</h4>
        {/* WooCommerce placeholder for future integration */}
      </TabPane>
    </Tabs>
  );
};

export default Feature;