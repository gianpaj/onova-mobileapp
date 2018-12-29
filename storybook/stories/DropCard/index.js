// @flow

import React from 'react';
import PropTypes from 'prop-types';

import { DropCard as DropCardComponent } from '../../../src/components';

export default function DropCard(props: any) {
  return <DropCardComponent {...props} />;
}

DropCard.defaultProps = {
  item: {
    posted: false,
    products: [
      {
        photoURIs: [
          'https://assets.onova.co/products/8LOvCz1MR-1-1546028852413.jpg',
        ],
        _id: '5c2687346657400c3ff4567b',
      },
      {
        photoURIs: [
          'https://assets.onova.co/products/8LOvCz1MR-1-1546028852413.jpg',
        ],
        _id: '5c2687346657400c3ff4567c',
      },
    ],
    status: 'valid',
    _id: '5c2687346657400c3ff4567a',
    scheduledAt: '2018-12-28T20:38:56.891Z',
    subscribers: [{}, {}, {}, {}],
    seller: {
      shippingAddress: {
        firstName: 'Олександр',
        lastName: 'Костінський ',
        city: 'db5c88f5-391c-11dd-90d9-001a92567626',
        departmentNovaposhta: '39931b85-e1c2-11e3-8c4a-0050568002cf',
      },
      accountStatus: 'verified',
      _id: '5afaa93daeeb1453812fc011',
      username: 'alex',
      profilePic:
        'http://assets.onova.co/users/5afaa93daeeb1453812fc011-1526385408286.jpg',
      displayName: 'Alex',
    },
    createdAt: '2018-12-28T20:27:32.932Z',
    updatedAt: '2018-12-28T20:27:32.932Z',
    uuid: 'yAyE262fS',
  },
  amITheSeller: false,
};

DropCard.propTypes = {
  style: PropTypes.any,
};
