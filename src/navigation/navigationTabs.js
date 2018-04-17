// @flow

import React from 'react';
import { Platform } from 'react-native';
import { TabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { Home, AddProduct, ChatRooms, Profile, Search } from '../screens';
import colors from '../config/colors';

import TabBarComponent from './TabBarComponent';

const isiOS = Platform.OS === 'ios';

const routeConfiguration = {
  Home: { screen: Home },
  Search: { screen: Search },
  New: { screen: AddProduct },
  ChatRooms: { screen: ChatRooms },
  Profile: { screen: Profile },
};

const tabBarConfiguration = {
  navigationOptions: ({ navigation }) => ({
    tabBarIcon: ({ focused }) => {
      const { routeName } = navigation.state;
      let iconName;
      switch (routeName) {
        case 'Home':
          // iconName = isiOS ? `ios-home${focused ? '' : ''}` : 'md-home';
          iconName = isiOS ? 'ios-home' : 'md-home';
          break;
        case 'Search':
          // ? `ios-add-circle${focused ? '' : ''}`
          iconName = isiOS ? 'ios-search' : 'md-search';
          break;
        case 'New':
          // ? `ios-add-circle${focused ? '' : ''}`
          iconName = isiOS ? 'ios-add-circle' : 'md-add-circle';
          break;
        case 'ChatRooms':
          iconName = 'md-basket';
          // iconName = isiOS
          // ? `ios-add-circle${focused ? '' : ''}`
          // : 'md-add-circle';
          break;
        // Profile uses <NotificationsDot> as its tabBarIcon
      }
      return (
        <Ionicons
          name={iconName}
          size={28}
          // eslint-disable-next-line
          style={isiOS ? { marginBottom: -3 } : {}}
          color={
            focused ? (isiOS ? colors.active : colors.primary) : colors.grey1
          }
        />
      );
    },
  }),
  tabBarOptions: {
    showIcon: true,
    // tint color is passed to text and icons (if enabled) on the tab bar
    activeTintColor: isiOS ? colors.active : colors.primary,
    // background color is for the tab component
    activeBackgroundColor: isiOS ? undefined : colors.grey5,
    inactiveTintColor: colors.grey1,
    inactiveBackgroundColor: colors.white,
    style: {
      backgroundColor: isiOS ? undefined : colors.grey3,
    },
    indicatorStyle: {
      backgroundColor: colors.primary,
    },
    labelStyle: isiOS ? {} : { fontSize: 12 },
  },
  // needed to open the Camera the first time opening the 'AddProduct' screen
  // i.e componentWillMount() of AddProduct
  tabBarPosition: 'bottom',
  animationEnabled: false,
  swipeEnabled: false,
  tabBarComponent: TabBarComponent,
};

export const TabsStack = TabNavigator(routeConfiguration, tabBarConfiguration);
