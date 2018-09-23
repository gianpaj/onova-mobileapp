// @flow
import React from 'react';
import { connect } from 'react-redux';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Button as NBButton } from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { DropsGrid } from '../components';
import colors from '../config/colors';
import I18n from '../i18n';

import type { UserData, ReduxState } from '../types';

const { height } = Dimensions.get('window');

type Props = {
  userData: UserData,
  navigation: NavigationScreenProp<*>,
  username: string,
};

class DropsTabContainer extends React.Component<Props, {}> {
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
    const { navigation, username } = this.props;

    return (
      <View style={styles.flex1}>
        <DropsGrid
          focused
          ref={this.imageGrid}
          username={username}
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
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(DropsTabContainer);
