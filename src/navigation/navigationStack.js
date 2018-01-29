// @flow
import { StackNavigator } from 'react-navigation';

import {
  AddProduct,
  Checkout,
  Login,
  OrdersList,
  OrderThread,
  Product,
  Profile,
  Settings,
  Signup,
} from '../screens';
import { TabsStack } from './navigationTabs';

export default StackNavigator(
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
    ordersList: { screen: OrdersList },
    orderThread: { screen: OrderThread },
    checkout: { screen: Checkout },
  },
  {
    headerMode: 'none',
  }
);
