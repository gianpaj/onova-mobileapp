// @flow
import { StackNavigator } from 'react-navigation';

import {
  AddProduct,
  Login,
  OrderThread,
  Product,
  Profile,
  Settings,
  Signup,
} from '../screens';
import { TabsStack } from './navigationTabs';

const navigator = StackNavigator(
  {
    login: { screen: Login },
    signup: {
      screen: Signup,
      navigationOptions: { gesturesEnabled: false },
    },
    product: {
      screen: Product,
      navigationOptions: { gesturesEnabled: false },
    },
    tabs: { screen: TabsStack },
    addProduct: { screen: AddProduct },
    settings: { screen: Settings },
    profile: { screen: Profile },
    orderThread: { screen: OrderThread },
  },
  {
    headerMode: 'none',
  }
);

export default navigator;
