// @flow

import React from 'react';
import { Platform } from 'react-native';
import { TabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Home, AddProduct, OrdersList, Profile } from '../screens';
import colors from '../config/colors';

const isiOS = Platform.OS === 'ios';

const routeConfiguration = {
  Home: { screen: Home },
  // Search
  New: { screen: AddProduct },
  OrdersList: { screen: OrdersList },
  Profile: { screen: Profile },
};

const tabBarConfiguration = {
  navigationOptions: ({ navigation }) => ({
    tabBarIcon: ({ focused }) => {
      const { routeName } = navigation.state;
      let iconName;
      switch (routeName) {
        case 'Home':
          iconName = isiOS ? `ios-home${focused ? '' : '-outline'}` : 'md-home';
          break;
        case 'New':
          iconName = isiOS
            ? `ios-add-circle${focused ? '' : '-outline'}`
            : 'md-add-circle';
          break;
        case 'OrdersList':
          iconName = 'md-basket';
          // iconName = isiOS
          // ? `ios-add-circle${focused ? '' : '-outline'}`
          // : 'md-add-circle';
          break;
        // Profile uses <NotificationsDot> as its tabBarIcon
      }
      return (
        <Ionicons
          name={iconName}
          size={28}
          // eslint-disable-next-line
          style={{ marginBottom: -3 }}
          color={
            focused ? (isiOS ? colors.active : colors.grey1) : colors.grey1
          }
        />
      );
    },
  }),
  tabBarOptions: {
    showIcon: true,
    // tint color is passed to text and icons (if enabled) on the tab bar
    activeTintColor: isiOS ? colors.active : colors.grey1,
    inactiveTintColor: colors.grey1,
    // background color is for the tab component
    activeBackgroundColor: isiOS ? undefined : colors.primary,
    inactiveBackgroundColor: colors.white,
    style: {
      backgroundColor: isiOS ? undefined : colors.grey3,
    },
  },
  // needed to open the Camera the first time opening the 'AddProduct' screen
  // i.e componentWillMount() of AddProduct
  tabBarPosition: 'bottom',
  animationEnabled: false,
  swipeEnabled: false,
};

export const TabsStack = TabNavigator(routeConfiguration, tabBarConfiguration);
