// @flow
import { StackNavigator } from 'react-navigation';

import {
  AddProduct,
  AddReview,
  Checkout,
  ChatRooms,
  Chat,
  Product,
  Profile,
  Reviews,
  Notifications,
  Followers,
  Settings,
  Search,
  SearchProductsResults,
  SignUpLogin,
} from '../screens';
import { TabsStack } from './navigationTabs';

export const StackNav = StackNavigator(
  {
    signuplogin: {
      screen: SignUpLogin,
      navigationOptions: { gesturesEnabled: false },
    },
    product: {
      screen: Product,
      navigationOptions: { gesturesEnabled: false },
      path: 'product/:productUUID',
    },
    tabs: { screen: TabsStack },
    addProduct: { screen: AddProduct },
    addReview: { screen: AddReview },
    reviews: { screen: Reviews },
    notifications: { screen: Notifications },
    settings: { screen: Settings },
    followers: { screen: Followers },
    search: { screen: Search },
    searchProductsResults: { screen: SearchProductsResults },
    profile: {
      screen: Profile,
      path: 'profile/:id',
    },
    chatRooms: { screen: ChatRooms },
    chat: {
      screen: Chat,
      path: 'chat/:name',
    },
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
