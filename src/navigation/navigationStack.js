// @flow
import { StackNavigator } from 'react-navigation';

import {
  AddProduct,
  AddReview,
  Checkout,
  Login,
  ChatRooms,
  Chat,
  Product,
  Profile,
  Reviews,
  Settings,
  Search,
  SearchProductsResults,
  Signup,
} from '../screens';
import { TabsStack } from './navigationTabs';

export const StackNav = StackNavigator(
  {
    signup: {
      screen: Signup,
      navigationOptions: { gesturesEnabled: false },
    },
    login: { screen: Login },
    product: {
      screen: Product,
      navigationOptions: { gesturesEnabled: false },
    },
    tabs: { screen: TabsStack },
    addProduct: { screen: AddProduct },
    addReview: { screen: AddReview },
    reviews: { screen: Reviews },
    settings: { screen: Settings },
    search: { screen: Search },
    searchProductsResults: { screen: SearchProductsResults },
    profile: { screen: Profile },
    chatRooms: { screen: ChatRooms },
    chat: { screen: Chat },
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
