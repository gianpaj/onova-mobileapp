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
import * as firebase from 'firebase';

import colors from './config/colors';
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
          iconName =
            Platform.OS === 'ios'
              ? `ios-home${focused ? '' : '-outline'}`
              : 'md-home';
          break;
        // case 'Links':
        //   iconName = Platform.OS === 'ios'
        //     ? `ios-link${focused ? '' : '-outline'}`
        //     : 'md-link';
        //   break;
        case 'Profile':
          iconName =
            Platform.OS === 'ios'
              ? `ios-person${focused ? '' : '-outline'}`
              : 'md-person';
      }
      return (
        <Ionicons
          name={iconName}
          size={28}
          style={{ marginBottom: -3 }}
          color={
            focused
              ? Platform.OS === 'ios' ? colors.active : colors.gray1
              : colors.gray5
          }
        />
      );
    },
  }),
  animationEnabled: false,
  tabBarOptions: {
    showIcon: true,
    // tint color is passed to text and icons (if enabled) on the tab bar
    activeTintColor: Platform.OS === 'ios' ? colors.active : colors.gray1,
    inactiveTintColor: colors.gray5,
    // background color is for the tab component
    activeBackgroundColor:
      Platform.OS === 'android' ? colors.primary : undefined,
    inactiveBackgroundColor: colors.white,
    style: {
      backgroundColor: Platform.OS === 'android' ? colors.grey3 : undefined,
  },
  },
  tabBarPosition: 'bottom',
};

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
  return <CustomNavigator screenProps={screenProps} />;
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
