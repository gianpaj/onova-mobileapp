import { StackNavigator } from 'react-navigation';

import { Login } from '../screens/Login';
import { Signup } from '../screens/Signup';
import { Product } from '../screens/Product';
import { Tabs } from './navigationTabs';

const navigator = StackNavigator(
  {
    login: { screen: Login },
    signup: { screen: Signup },
    product: { screen: Product },
    tabs: { screen: Tabs },
  },
  {
    headerMode: 'none',
  }
);

export default navigator;
