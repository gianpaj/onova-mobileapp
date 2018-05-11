// @flow

import React from 'react';
import { Platform } from 'react-native';
import { TabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Home, AddOrEditProduct, ChatRooms, Profile, Search } from '../screens';
import colors from '../config/colors';

import TabBarComponent from './TabBarComponent';

const isiOS = Platform.OS === 'ios';

const routeConfiguration = {
  home: { screen: Home },
  search: { screen: Search },
  new: { screen: AddOrEditProduct },
  orders: { screen: ChatRooms },
  profile: { screen: Profile },
};

const tabBarConfiguration = {
  navigationOptions: ({ navigation }) => ({
    tabBarIcon: ({ focused }) => {
      const { routeName } = navigation.state;
      let iconName;
      switch (routeName) {
        case 'home':
          // iconName = isiOS ? `ios-home${focused ? '' : ''}` : 'md-home';
          iconName = isiOS ? 'ios-home' : 'md-home';
          break;
        case 'search':
          // ? `ios-add-circle${focused ? '' : ''}`
          iconName = isiOS ? 'ios-search' : 'md-search';
          break;
        case 'new':
          // ? `ios-add-circle${focused ? '' : ''}`
          iconName = isiOS ? 'ios-add-circle' : 'md-add-circle';
          break;
        case 'orders':
          iconName = 'md-basket';
          break;
        // Profile uses <NotificationsDot> as its tabBarIcon
      }
      return (
        <Ionicons
          name={iconName}
          size={28}
          // eslint-disable-next-line
          style={isiOS && { marginBottom: -3 }}
          color={focused ? colors.primary : colors.grey4}
        />
      );
    },
  }),
  tabBarOptions: {
    showLabel: false,
    showIcon: true,
    // tint color is passed to text and icons (if enabled) on the tab bar
    // activeTintColor: isiOS ? colors.active : colors.primary,
    // background color is for the tab component
    activeBackgroundColor: colors.grey6,
    inactiveTintColor: colors.grey1,
    inactiveBackgroundColor: colors.grey6,
    style: {
      backgroundColor: colors.grey3,
      borderTopColor: colors.grey4,
    },
    indicatorStyle: {
      backgroundColor: colors.primary,
    },
    // labelStyle: !isiOS && { fontSize: 12 },
  },
  tabBarPosition: 'bottom',
  animationEnabled: false,
  swipeEnabled: false,
  tabBarComponent: TabBarComponent,
};

export const TabsStack = TabNavigator(routeConfiguration, tabBarConfiguration);
