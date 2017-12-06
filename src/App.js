// @flow

import React from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { StackNavigator, TabNavigator } from 'react-navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Root } from 'native-base';
import { updateFocus } from '@patwoz/react-navigation-is-focused-hoc';

import * as firebase from 'firebase';

import colors from './config/colors';
import Login from './screens/Login';
import Signup from './screens/Signup';
import Home from './screens/Home';
import AddProduct from './screens/AddProduct';
import Profile from './screens/Profile';

const isiOS = Platform.OS === 'ios';

const routeConfiguration = {
  Home: { screen: Home },
  // Search
  New: { screen: AddProduct },
  // Orders
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
        case 'Profile':
          iconName = isiOS
            ? `ios-person${focused ? '' : '-outline'}`
            : 'md-person';
      }
      return (
        <Ionicons
          name={iconName}
          size={28}
          style={{ marginBottom: -3 }}
          color={
            focused ? (isiOS ? colors.active : colors.gray1) : colors.gray5
          }
        />
      );
    },
  }),
  animationEnabled: false,
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
};

// gets the current screen from navigation state
function getCurrentRouteName(navigationState) {
  if (!navigationState) {
    return null;
  }
  const route = navigationState.routes[navigationState.index];
  // dive into nested navigators
  if (route.routes) {
    return getCurrentRouteName(route);
  }
  return route.routeName;
}

export const Tabs = TabNavigator(routeConfiguration, tabBarConfiguration);

const Navigator = ({ initialRouteName, screenProps }) => {
  const routeConfigs = {
    Login: { screen: Login },
    Signup: { screen: Signup },
    Tabs: { screen: Tabs },
  };
  const stackNavigatorConfigs = {
    initialRouteName,
    headerMode: 'none',
  };
  const CustomNavigator = StackNavigator(routeConfigs, stackNavigatorConfigs);
  return (
    <CustomNavigator
      onNavigationStateChange={(prevState, currentState) => {
        const currentScreen = getCurrentRouteName(currentState);
        const prevScreen = getCurrentRouteName(prevState);

        if (prevScreen !== currentScreen) {
          // If you want to ignore the state changed from `DrawerNavigator`, use this:
          /*
            if (/^Drawer(Open|Close|Toggle)$/.tes(newState)) === false) {
              updateFocus(newState);
              return;
            }
          */

          updateFocus(currentState);
        }
      }}
      screenProps={screenProps}
    />
  );
};

const NavWrapper = ({ initialRouteName, screenProps }) => (
  <Navigator screenProps={screenProps} initialRouteName={initialRouteName} />
);

export default class App extends React.Component {
  state = {
    loggedIn: false,
    loading: true,
    userData: null,
  };

  componentWillMount() {
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: '***REMOVED***',
      authDomain: 'onova-183307.firebaseapp.com',
      databaseURL: 'https://onova-183307.firebaseio.com',
      projectId: 'onova-183307',
      storageBucket: 'onova-183307.appspot.com',
      messagingSenderId: '530398476253',
    };
    firebase.initializeApp(firebaseConfig);

    AsyncStorage.getItem('userData')
      .then(userData => {
        if (userData) {
          const jsonData = JSON.parse(userData);
          console.log(jsonData);
          this.setState({ loggedIn: true, loading: false, userData: jsonData });
        } else {
          console.log(userData);
          this.setState({ loggedIn: false, loading: false, userData: null });
        }
      })
      .catch(err => console.error(err));
  }

  render() {
    const { loading, loggedIn } = this.state;

    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <Root>
        <NavWrapper initialRouteName={loggedIn ? 'Tabs' : 'Login'} />
      </Root>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
