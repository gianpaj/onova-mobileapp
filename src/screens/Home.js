// @flow
import colors from '../config/colors';

import React, { PureComponent } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Body, Left, Right, Container, Title } from 'native-base';
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';

import I18n from '../i18n';
import { Header, ImageGrid } from '../components';

import type { NavigationScreenProp } from 'react-navigation';
import type { Route, NavigationState } from 'react-native-tab-view/types';

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

  // onShare() {
  //   alert('code me like those french girls 🎨');
  // }

  render() {
    return (
      <Container testID="Home">
        {/* <View style={styles.statusBarUnderlay} /> */}
        <Header hasTabs>
          <Left style={styles.container} />
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>ONOVA</Title>
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
          useNativeDriver
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
