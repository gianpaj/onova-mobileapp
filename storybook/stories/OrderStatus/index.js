import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import OrderStatus from '../../../src/components/OrderStatus';

export default function OrderStatusComponent(props) {
  return (
    <View style={{ paddingTop: 20 }}>
      <OrderStatus {...props} />
    </View>
  );
}

OrderStatusComponent.propTypes = {
  order: PropTypes.object,
  style: PropTypes.object,
};
