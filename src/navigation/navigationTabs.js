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
      }
      return (
        <Ionicons
          name={iconName}
          size={28}
          // eslint-disable-next-line
          style={{ marginBottom: -3 }}
          color={
            focused ? (isiOS ? colors.active : colors.gray1) : colors.gray5
          }
        />
      );
    },
  }),
  tabBarOptions: {
    showIcon: true,
    // tint color is passed to text and icons (if enabled) on the tab bar
    activeTintColor: isiOS ? colors.active : colors.gray1,
    inactiveTintColor: colors.gray5,
    // background color is for the tab component
    activeBackgroundColor: !isiOS ? colors.primary : undefined,
    inactiveBackgroundColor: colors.white,
    style: {
      backgroundColor: !isiOS ? colors.grey3 : undefined,
    },
  },
  // needed to open the Camera the first time opening the 'AddProduct' screen
  // i.e componentWillMount() of AddProduct
  lazy: true,
  tabBarPosition: 'bottom',
  animationEnabled: false,
  swipeEnabled: false,
};

export const TabsStack = TabNavigator(routeConfiguration, tabBarConfiguration);
