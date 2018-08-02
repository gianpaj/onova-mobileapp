// @flow
import colors from '../config/colors';

import React, { PureComponent } from 'react';
import {
  Alert,
  Dimensions,
  Share,
  // Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Body, Button, Icon, Left, Right, Title } from 'native-base';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import I18n from '../i18n';
import { Header, ImageGrid } from '../components';

import type { NavigationScreenProp } from 'react-navigation';
import type { Route, NavigationState } from 'react-native-tab-view';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type Props = {
  navigation?: NavigationScreenProp<*>,
};

type State = NavigationState<
  Route<{
    key: string,
    title: string,
  }>
>;

export class Home extends PureComponent<Props, State> {
  state = {
    index: 0,
    routes: [
      { key: 'clothes', title: I18n.t('home.clothes_tab') },
      { key: 'shoes', title: I18n.t('home.shoes_tab') },
      { key: 'other', title: I18n.t('home.other_tab') },
    ],
  };

  _handleIndexChange = (index: number) => this.setState({ index });

  _renderTabBar = props => (
    <TabBar
      {...props}
      scrollEnabled
      indicatorStyle={styles.indicator}
      style={styles.header}
      tabStyle={styles.tab}
      labelStyle={styles.label}
    />
  );

  _renderScene = ({ route, navigationState }) => {
    switch (route.key) {
      case 'clothes':
        return (
          <ImageGrid
            focused={navigationState.index === 0}
            apiURL="/api/feed/flat/?categoryIds=0"
            navigation={this.props.navigation}
          />
        );
      case 'shoes':
        return (
          <ImageGrid
            focused={navigationState.index === 1}
            apiURL="/api/feed/flat/?categoryIds=1"
            navigation={this.props.navigation}
          />
        );
      case 'other':
        return (
          <ImageGrid
            focused={navigationState.index === 2}
            apiURL="/api/feed/flat/?categoryIds=2"
            navigation={this.props.navigation}
          />
        );
      default:
        return null;
    }
  };

  /*_renderScene = SceneMap({
    clothes: () => (
      <ImageGrid
        apiURL="/api/feed/flat/?categoryIds=0"
        navigation={this.props.navigation}
      />
    ),
    shoes: () => (
      <ImageGrid
        apiURL="/api/feed/flat/?categoryIds=1"
        navigation={this.props.navigation}
      />
    ),
    other: () => (
      <ImageGrid
        apiURL="/api/feed/flat/?categoryIds=2"
        navigation={this.props.navigation}
      />
    ),
  });*/

  onShare() {
    Share.share({ message: I18n.t('home.share'), title: 'Share' });
  }

  onInfoIcon() {
    Alert.alert(
      I18n.t('home.alert_info_title'),
      I18n.t('home.alert_info_body')
    );
  }

  render() {
    return (
      <View testID="Home" style={{ flex: 1 }}>
        {/* <View style={styles.statusBarUnderlay} /> */}
        <Header hasTabs>
          <Left style={styles.container}>
            <Button
              transparent
              dark
              style={{ marginLeft: 5 }}
              onPress={this.onInfoIcon}>
              <MaterialCommunityIcons name="information-outline" size={18} />
            </Button>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>ONOVA</Title>
          </Body>
          <Right>
            <Button transparent onPress={this.onShare}>
              <Icon
                style={{ color: colors.black }}
                android="md-person-add"
                ios="ios-person-add"
              />
            </Button>
          </Right>
        </Header>
        <TabView
          testID="Tabs"
          style={styles.container}
          navigationState={this.state}
          renderScene={this._renderScene}
          renderTabBar={this._renderTabBar}
          onIndexChange={this._handleIndexChange}
          initialLayout={initialLayout}
          useNativeDriver
        />
      </View>
    );
  }
}

// const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;

const styles = StyleSheet.create({
  // statusBarUnderlay: {
  //   marginTop: STATUS_BAR_HEIGHT,
  // },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  indicator: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.primary,
    fontWeight: '400',
  },
  header: {
    backgroundColor: colors.bgDefault,
    elevation: 2,
  },
  tab: {
    width: initialLayout.width / 3,
  },
});
