// @flow
import { StackNavigator } from 'react-navigation';
import { Animated, Easing, Platform } from 'react-native';
import CardStackStyleInterpolator from 'react-navigation/src/views/CardStack/CardStackStyleInterpolator';

import {
  AddOrEditProduct,
  AddReview,
  Chat,
  ChatRooms,
  Checkout,
  CreateDrop,
  ConfirmOrder,
  DropsFeed,
  Followers,
  Following,
  EnterCardInfo,
  IntroScreens,
  Notifications,
  MarkdownDoc,
  PaymentView,
  Product,
  Profile,
  Reviews,
  Search,
  SearchProductsResults,
  Settings,
  SignUpLogin,
  Suggestions,
} from '../screens';
import colors from '../config/colors';
import { TabsStack } from './navigationTabs';

const StackNav = StackNavigator(
  {
    signuplogin: {
      screen: SignUpLogin,
    },
    introScreens: { screen: IntroScreens },
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
    createDrop: {
      screen: CreateDrop,
      navigationOptions: {
        gesturesEnabled: false,
      },
    },
    addReview: { screen: AddReview },
    confirmOrder: { screen: ConfirmOrder },
    dropsFeed: { screen: DropsFeed },
    reviews: { screen: Reviews },
    notifications: { screen: Notifications },
    markdownDoc: { screen: MarkdownDoc },
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
    checkout: { screen: Checkout },
    enterCardInfo: { screen: EnterCardInfo },
    paymentView: { screen: PaymentView },
    suggestions: { screen: Suggestions },
  },
  {
    headerMode: 'none',
    cardStyle: {
      backgroundColor: colors.white,
      shadowColor: 'transparent',
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
