// @flow

import React from 'react';
import PropTypes from 'prop-types';
import ReviewCard from '../../../src/components/ReviewCard';

export default function ReviewCardComponent(props) {
  return <ReviewCard {...props} />;
}

ReviewCardComponent.defaultProps = {
  block: false,
  onPress: () => {},
};

ReviewCardComponent.propTypes = {
  as: PropTypes.string,
  review: PropTypes.object,
  onPress: PropTypes.func,
};
