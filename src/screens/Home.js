// @flow
import colors from '../config/colors';

import React, { PureComponent } from 'react';
// prettier-ignore
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
} from 'react-native';
import {
  Body,
  Left,
  Right,
  Button,
  Icon,
  Container,
  Header,
} from 'native-base';
import type { NavigationScreenProp } from 'react-navigation';
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';
import type { Route, NavigationState } from 'react-native-tab-view/types';

import { ImageGrid } from '../components';

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
      { key: 'clothes', title: 'Clothes' },
      { key: 'shoes', title: 'Shoes' },
      { key: 'other', title: 'Other' },
    ],
  };

  _handleIndexChange = (index: number) => this.setState({ index });

  _renderHeader = props => (
    <TabBar
      {...props}
      scrollEnabled
      indicatorStyle={styles.indicator}
      style={styles.header}
      tabStyle={styles.tab}
      labelStyle={styles.label}
    />
  );

  _renderScene = SceneMap({
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
  });

  onShare() {
    alert('code me like those french girls 🎨');
  }

  render() {
    return (
      <Container testID="Home">
        {/* <View style={styles.statusBarUnderlay} /> */}
        <Header hasTabs>
          <Left style={styles.container} />
          <Body style={styles.container}>
            <Text style={{ alignSelf: 'center', fontWeight: 'bold' }}>
              ØNOVA
            </Text>
          </Body>
          <Right />
          {/* <Right>
            <Button transparent>
              <Icon
                style={{ color: colors.black }}
                onPress={this.onShare}
                name={
                  Platform.OS === 'ios' ? 'ios-person-add' : 'md-person-add'
                }
              />
            </Button>
          </Right> */}
        </Header>
        <TabViewAnimated
          testID="Tabs"
          style={styles.container}
          navigationState={this.state}
          renderScene={this._renderScene}
          renderHeader={this._renderHeader}
          onIndexChange={this._handleIndexChange}
          initialLayout={initialLayout}
        />
      </Container>
    );
  }
}

// const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 20 : 0;

const styles = StyleSheet.create({
  // statusBarUnderlay: {
  //   marginTop: STATUS_BAR_HEIGHT,
  // },
  container: {
    flex: 1,
  },
  indicator: {
    height: 3,
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.primary,
    fontWeight: '400',
  },
  header: {
    backgroundColor: colors.bgDefault,
  },
  tab: {
    width: initialLayout.width / 3,
  },
});
