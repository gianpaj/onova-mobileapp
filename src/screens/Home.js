// @flow

import React, { PureComponent } from 'react';

import { connect } from 'react-redux';
import { Dimensions, StyleSheet, View } from 'react-native';
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
import colors from '../config/colors';

import Megaphone from '../assets/svg/megaphone';

import type { NavigationScreenProp } from 'react-navigation';
import type { Route, NavigationState } from 'react-native-tab-view';

const initialLayout = {
  height: 0,
  width: Dimensions.get('window').width,
};

type Props = {
  navigation?: NavigationScreenProp<*>,
  skippedLogin: boolean,
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

class HomeComponent extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      index: 0,
      dialogVisible: false,
      routes: [
        { key: 0, title: I18n.t('home.clothes_tab') },
        { key: 1, title: I18n.t('home.shoes_tab') },
        { key: 2, title: I18n.t('home.other_tab') }, // accessories
      ],
    };
    if (APP_NAME == 'onova') {
      this.state.routes = [
        { key: 0, title: I18n.t('home.clothes_tab') },
        { key: 1, title: I18n.t('home.other_tab') }, // accessories
        { key: 2, title: I18n.t('home.home_tab') },
      ];
    }
  }

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
    let sellerType = 'reseller';
    let categoryIdsTabs = {
      0: '[0,1]',
      1: '2',
      2: '[10,11,12]',
    };
    if (APP_NAME === 'onova') {
      sellerType = 'designer';
      categoryIdsTabs = {
        0: '[0,1,2]',
        1: '[10,11,12]',
        2: '[20,21,22]',
      };
    }
    if (this.props.skippedLogin) {
      switch (route.key) {
        case 0:
        case 1:
        case 2:
          return (
            <ImageGrid apiURL={`/api/products/?categoryIds=${categoryIdsTabs[route.key]}&sellerType=${sellerType}`} />
          );
        default:
          return null;
      }
    }

    switch (route.key) {
      case 0:
      case 1:
      case 2:
        return <ImageGrid apiURL={`/api/products/?categoryIds=${categoryIdsTabs[route.key]}`} />;
      default:
        return null;
    }
  };

  // onShare() {
  //   Share.share({ message: I18n.t('product.share'), title: 'Share' });
  //   if (analyticsEnabled) Analytics.track('press_share_invite');
  // }

  goToDropsFeed = () => {
    if (this.props.skippedLogin) {
      return this.props.navigation.navigate('inAppAuth');
    }
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
            <Title>{APP_NAME.toUpperCase()}</Title>
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

const mapStateToProps = (state: any) => ({
  token: state.LoginReducer.token,
  skippedLogin: state.LoginReducer.skippedLogin,
  shouldRefresh: state.RefresherReducer.shouldRefresh,
});

export const Home = connect(mapStateToProps)(HomeComponent);

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
  header: {
    backgroundColor: colors.bgDefault,
    elevation: 2,
  },
  indicator: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.primary,
    fontWeight: '400',
    marginHorizontal: 0,
  },
  tab: {
    width: initialLayout.width / 3,
  },
  url: {
    color: colors.active,
    textDecorationLine: 'underline',
  },
});
