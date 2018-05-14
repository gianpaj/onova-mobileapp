// @flow

import React from 'react';
import { Title } from 'native-base';
import colors from '../config/colors';

const TitleContainer = (props: any): React$Element<any> => (
  <Title style={{ color: colors.black }} {...props}>
    {props.children}
  </Title>
);

export default TitleContainer;
