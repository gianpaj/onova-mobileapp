// @flow
import React from 'react';
import {
  Platform,
  Text,
} from 'react-native';
import { StackNavigator, TabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Root } from 'native-base';

import Login from './screens/Login';
import Signup from './screens/Signup';
import Home from './screens/Home';
// import BlankPage from './screens/BlankPage';
// import Sidebar from './screens/Sidebar';

const routeConfiguration = {
  Home: { screen: Home },
  // Search
  // Add
  // Orders
  // Profile: { screen: BlankPage },
};

const tabBarConfiguration = {
  navigationOptions: ({ navigation }) => ({
    tabBarIcon: ({ focused }) => {
      const { routeName } = navigation.state;
      let iconName;
      switch (routeName) {
        case 'Home':
          iconName = Platform.OS === 'ios'
            ? `ios-home${focused ? '' : '-outline'}`
            : 'md-home';
          break;
        // case 'Links':
        //   iconName = Platform.OS === 'ios'
        //     ? `ios-link${focused ? '' : '-outline'}`
        //     : 'md-link';
        //   break;
        case 'Profile':
          iconName = Platform.OS === 'ios'
            ? `ios-person${focused ? '' : '-outline'}`
            : 'md-person';
      }
      return (
        <Ionicons
          name={iconName}
          size={28}
          style={{ marginBottom: -3 }}
          /* color={focused} */
          color={focused ? '#2f95dc' : '#ccc'}
        />
      );
    },
  }),
  animationEnabled: true,
  tabBarOptions:{
    showIcon : true,
    // tint color is passed to text and icons (if enabled) on the tab bar
    activeTintColor: '#2f95dc',
    inactiveTintColor: '#ccc',
    // background color is for the tab component
    activeBackgroundColor: '#fefefe',
    inactiveBackgroundColor: 'white',
  }
};


export const Tabs = TabNavigator(routeConfiguration, tabBarConfiguration);

const AppNavigator = StackNavigator(
  {
    Login: { screen: Login },
    Signup: { screen: Signup },
    Tabs: { screen: Tabs },
  },
  {
    initialRouteName: 'Login',
    headerMode: 'none',
  }
);

export default () =>
<Root>
  <AppNavigator />
</Root>;
