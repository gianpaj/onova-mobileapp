// @flow
import { StackNavigator } from 'react-navigation';
import { Animated, Easing, Platform } from 'react-native';
import CardStackStyleInterpolator from 'react-navigation/src/views/CardStack/CardStackStyleInterpolator';

import {
  AddOrEditProduct,
  AddReview,
  // Checkout,
  ChatRooms,
  Chat,
  Product,
  Profile,
  Reviews,
  Notifications,
  Followers,
  Following,
  Settings,
  Search,
  SearchProductsResults,
  SignUpLogin,
} from '../screens';
import colors from '../config/colors';
import { TabsStack } from './navigationTabs';

export const StackNav = StackNavigator(
  {
    signuplogin: {
      screen: SignUpLogin,
    },
    product: {
      screen: Product,
      path: 'product/:productUUID',
    },
    tabs: { screen: TabsStack },
    addOrEditProduct: {
      screen: AddOrEditProduct,
      navigationOptions: {
        gesturesEnabled: false,
      },
    },
    addReview: { screen: AddReview },
    reviews: { screen: Reviews },
    notifications: { screen: Notifications },
    settings: { screen: Settings },
    followers: { screen: Followers },
    following: { screen: Following },
    search: { screen: Search },
    searchProductsResults: { screen: SearchProductsResults },
    profileInStack: {
      screen: Profile,
    },
    chatRooms: { screen: ChatRooms },
    chat: {
      screen: Chat,
      path: 'chat/:name',
    },
    // checkout: { screen: Checkout },
  },
  {
    headerMode: 'none',
    cardStyle: {
      backgroundColor: colors.white,
    },
    navigationOptions: {
      gesturesEnabled: Platform.OS === 'ios',
    },
    transitionConfig: () => ({
      transitionSpec: {
        duration: 175,
        easing: Easing.out(Easing.ease),
        timing: Animated.timing,
        useNativeDriver: true,
      },
      screenInterpolator: CardStackStyleInterpolator.forHorizontal,
    }),
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
