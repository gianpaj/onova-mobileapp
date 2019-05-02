// @flow
import colors from '../config/colors';

import React, { PureComponent } from 'react';
import {
  Dimensions,
  // Share,
  // Platform,
  StyleSheet,
  View,
} from 'react-native';
import Config from 'react-native-config';
import { APP_NAME } from 'react-native-dotenv';
import { Body, Button, Left, Right } from 'native-base';
import { TabView, TabBar } from 'react-native-tab-view';
// import Analytics from 'react-native-analytics-segment-io';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Dialog from 'react-native-dialog';
import ParsedText from 'react-native-parsed-text';

import I18n from '../i18n';
import { Header, ImageGrid, Title } from '../components';
// import * as api from '../utils/api';
import * as linking from '../utils/linking';

import Megaphone from '../assets/svg/megaphone';

import type { NavigationScreenProp } from 'react-navigation';
import type { Route, NavigationState } from 'react-native-tab-view';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type Props = {
  navigation?: NavigationScreenProp<*>,
};

type State = {
  ...NavigationState<
    Route<{
      key: string,
      title: string,
    }>
  >,
  dialogVisible: boolean,
};

// const { analyticsEnabled } = api;

export class Home extends PureComponent<Props, State> {
  state = {
    index: 0,
    dialogVisible: false,
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

  _renderScene = ({ route }) => {
    switch (route.key) {
      case 'clothes':
        return <ImageGrid apiURL="/api/feed/flat/?categoryIds=0" navigation={this.props.navigation} />;
      case 'shoes':
        return <ImageGrid apiURL="/api/feed/flat/?categoryIds=1" navigation={this.props.navigation} />;
      case 'other':
        return <ImageGrid apiURL="/api/feed/flat/?categoryIds=2" navigation={this.props.navigation} />;
      default:
        return null;
    }
  };

  // onShare() {
  //   Share.share({ message: I18n.t('home.share'), title: 'Share' });
  //   if (analyticsEnabled) Analytics.track('press_share_invite');
  // }

  goToDropsFeed = () => {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'dropsFeed',
      key: 'dropsFeed',
    });
  };

  render() {
    return (
      <View testID="Home" style={{ flex: 1 }}>
        <Header hasTabs>
          <Left style={styles.container}>
            <Button transparent dark style={{ marginLeft: 5 }} onPress={this.toggleDialog}>
              <MaterialCommunityIcons name="information-outline" size={18} />
            </Button>
          </Left>
          <Body style={styles.container}>
            {/* eslint-disable-next-line react-native/no-raw-text */}
            <Title>{Config.APP_NAME}</Title>
          </Body>
          <Right>
            <Button transparent onPress={this.goToDropsFeed}>
              <Megaphone width={19} height={19} />
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
          lazy
        />
        {this.renderInfoDialog()}
      </View>
    );
  }

  toggleDialog = () => this.setState(prevState => ({ dialogVisible: !prevState.dialogVisible }));

  renderInfoDialog = () => (
    <React.Fragment>
      <Dialog.Container
        visible={this.state.dialogVisible}
        onBackdropPress={this.toggleDialog}
        onBackButtonPress={this.toggleDialog}
        renderToHardwareTextureAndroid>
        <Dialog.Title>{I18n.t('home.alert_info_title')}</Dialog.Title>

        <ParsedText
          style={{ marginTop: 4, margin: 18 }}
          parse={[
            { type: 'url', style: styles.url, onPress: linking.openURL },
            {
              pattern: /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{2,3}[-\s\.]?[0-9]{2,3}/,
              style: styles.url,
              onPress: linking.call,
            },
          ]}>
          {I18n.t('home.alert_info_body')}
        </ParsedText>
        <Dialog.Button label={I18n.t('product.toast_warning_ok_button')} onPress={this.toggleDialog} />
      </Dialog.Container>
    </React.Fragment>
  );
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
    marginHorizontal: 0,
  },
  header: {
    backgroundColor: colors.bgDefault,
    elevation: 2,
  },
  tab: {
    width: initialLayout.width / 3,
  },
  url: {
    color: colors.active,
    textDecorationLine: 'underline',
  },
});
