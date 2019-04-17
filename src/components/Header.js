// @flow

import React from 'react';
import { Header } from 'native-base';
import colors from '../config/colors';

const HeaderContainer = (props: any): React$Element<any> => (
  <Header androidStatusBarColor={colors.primary} style={{ backgroundColor: colors.bgDefault }} {...props} />
);

export default HeaderContainer;
