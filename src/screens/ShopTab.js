// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Button as NBButton } from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { ImageGrid } from '../components';
import colors from '../config/colors';
import I18n from '../i18n';

import type { UserData, Dispatch, ReduxState } from '../types';

const { height } = Dimensions.get('window');

type Props = {
  userData: UserData,
  navigation: NavigationScreenProp<*>,
  userId: string,
};

class ShopTabContainer extends React.Component<Props, {}> {
  imageGrid;

  constructor(props) {
    super(props);
    this.imageGrid = React.createRef();
  }

  isMe(): boolean {
    const navState = this.props.navigation.state;
    if (!navState.params) {
      return true;
    }

    return navState.params._id === this.props.userData._id;
  }

  render() {
    const { navigation, userId } = this.props;

    return (
      <View style={styles.flex1}>
        <ImageGrid
          focused
          ref={this.imageGrid}
          apiURL={`/api/products?userid=${userId}`}
          navigation={navigation}
          emptyState={
            <View style={styles.emptyContainer}>
              {this.isMe() ? (
                <View>
                  <MaterialCommunityIcons
                    size={48}
                    name={'cash-100'}
                    color={colors.grey2}
                    style={styles.emptyStateIcon}
                  />
                  <Text style={styles.boldText}>
                    {I18n.t('profile.empty_state_title')}
                  </Text>
                  <Text style={styles.centerText}>
                    {I18n.t('profile.empty_state_message_mine')}
                  </Text>
                  <NBButton
                    block
                    dark
                    style={styles.searchButton}
                    onPress={() => navigation.navigate('addOrEditProduct')}>
                    <Text
                      // eslint-disable-next-line
                      style={{
                        fontSize: 16,
                        color: colors.white,
                      }}>
                      {I18n.t('profile.empty_state_button_mine')}
                    </Text>
                  </NBButton>
                </View>
              ) : (
                <Text>{I18n.t('profile.empty_state_message_others')}</Text>
              )}
            </View>
          }
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  alignCenter: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  icon: {
    color: colors.grey1,
    fontSize: 27,
  },
  avatarContainer: {
    marginTop: 4,
  },
  profileRight: {
    alignSelf: 'flex-start',
    flex: 1,
    paddingLeft: 10,
    width: '100%',
  },
  profileTop: {
    backgroundColor: colors.white,
    elevation: 0.5, // android
    paddingHorizontal: 10,
    paddingTop: 10,
    shadowColor: colors.black,
    shadowOffset: { height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 0.5,
    zIndex: 1,
  },
  userNumbers: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  numbers: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    color: colors.grey2,
    fontSize: 14,
  },
  editOrFollowButton: {
    marginVertical: 10,
    backgroundColor: colors.bgDefault,
    borderColor: colors.greyOutline,
    borderRadius: 5,
  },
  editOrFollowButtonText: {
    color: colors.grey1,
  },
  saveButton: {
    backgroundColor: colors.active,
  },
  noticeBar: {
    color: colors.grey2,
    textAlign: 'center',
    width: '34.5%',
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    height: height - 350,
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateIcon: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  boldText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  centerText: {
    marginTop: 5,
  },
  searchButton: {
    marginTop: 20,
  },
  indicator: {
    backgroundColor: colors.primary,
  },
  tabBarlabel: {
    color: colors.black,
    fontWeight: '400',
  },
  tabbar: {
    backgroundColor: colors.white,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(ShopTabContainer);
