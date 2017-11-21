// @flow
import React from 'react';
import {
  ActivityIndicator,
  AsyncStorage,
  Platform,
  StyleSheet,
  Text,
  View,
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
    AsyncStorage.getItem('userData')
      .then((userData) => {
        if (userData) {
          const jsonData = JSON.parse(userData);
          console.log(jsonData);
          this.setState({ loggedIn: true, loading: false, userData: jsonData })
        } else {
          console.log(userData);
          this.setState({ loggedIn: false, loading: false, userData: null })
        }
      })
      .catch(err => console.error(err));
  }

  render() {
    const { loading, loggedIn } = this.state;

    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large"/>
        </View>
      );
    }

    return (
      <Root>
        <NavWrapper initialRouteName={loggedIn ? 'Tabs' : 'Login'}/>
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
})
