// src/components/InventoryEmptyState.jsx

import React from 'react';
import { Image, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * InventoryEmptyState component displays a message and an action button when there is no inventory data.
 */
const InventoryEmptyState = ({ onCTAClick }) => {
  return (
    <View style={styles.container}>
      {/* Display an illustration */}
      <Image
        source={require('../assets/empty_inventory.png')}
        style={styles.illustration}
        alt="Inventory Empty"
      />
      
      {/* Display a message */}
      <Text style={styles.message}>No items in inventory.</Text>
      
      {/* Display a CTA button */}
      <TouchableOpacity style={styles.button} onPress={onCTAClick}>
        <Text style={styles.buttonText}>Add New Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  illustration: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InventoryEmptyState;