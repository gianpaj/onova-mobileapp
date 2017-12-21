// @flow
import colors from '../config/colors';

import React from 'react';
// prettier-ignore
import {
  StyleSheet,
  Text,
  Platform,
  Dimensions,
  // $FlowFixMe
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
import { TabViewAnimated, TabBar, SceneMap } from 'react-native-tab-view';
// $FlowFixMe
import { NavigationScreenProp } from 'react-navigation';

import { ImageGrid } from '../components/ImageGrid';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type Props = {
  navigation?: NavigationScreenProp,
};

type State = {
  index: number,
  routes: Array<{ key: string, title: string }>,
};

export class Home extends React.PureComponent<Props, State> {
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

  // _openItem = item => {
  //   this.props.navigation.navigate('Product', item);
  // };

  _renderScene = SceneMap({
    clothes: () => <ImageGrid apiURL="/api/products" />,
    shoes: () => <ImageGrid apiURL="/api/products" />,
    other: () => <ImageGrid apiURL="/api/products" />,
  });

  onShare() {
    alert('to do');
  }

  render() {
    return (
      <Container testID="Home">
        {/* <View style={styles.statusBarUnderlay} /> */}
        <Header hasTabs>
          <Left />
          <Body>
            <Text style={{ fontWeight: 'bold' }}>ØNOVA</Text>
          </Body>
          <Right>
            <Button transparent>
              <Icon
                style={{ color: colors.black }}
                onPress={this.onShare}
                name={
                  Platform.OS === 'ios' ? 'ios-person-add' : 'md-person-add'
                }
              />
            </Button>
          </Right>
        </Header>
        <TabViewAnimated
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
    width: 120,
  },
});
