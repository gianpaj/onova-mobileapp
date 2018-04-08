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
  Search,
  Signup,
} from '../screens';
import { TabsStack } from './navigationTabs';

export const StackNav = StackNavigator(
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
    search: { screen: Search },
    profile: { screen: Profile },
    ordersList: { screen: OrdersList },
    orderThread: { screen: OrderThread },
    checkout: { screen: Checkout },
  },
  {
    headerMode: 'none',
  }
);

const prevGetStateForActionStackNav = StackNav.router.getStateForAction;

StackNav.router.getStateForAction = (action, state) => {
  if (state && action.type === 'ReplaceCurrentScreen') {
    const routes = state.routes.slice(0, state.routes.length - 1);
    routes.push(action);
    return {
      ...state,
      routes,
      index: routes.length - 1,
    };
  }
  return prevGetStateForActionStackNav(action, state);
};

export default StackNav;
