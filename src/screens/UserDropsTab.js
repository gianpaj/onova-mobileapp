// @flow
import React from 'react';
import { connect } from 'react-redux';
import { StyleSheet, Text, View } from 'react-native';
import { Button as NBButton } from 'native-base';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { UserDropsGrid } from '../components';
import colors from '../config/colors';
import I18n from '../i18n';

import type { UserData, ReduxState } from '../types';
import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  userData: UserData,
  navigation: NavigationScreenProp<*>,
  username: string,
};

class UserDropsTabContainer extends React.Component<Props, {}> {
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
        <UserDropsGrid
          focused
          ref={this.imageGrid}
          username={username}
          navigation={navigation}
          emptyState={
            <View style={styles.emptyContainer}>
              {!this.isMe() ? (
                <Text>{I18n.t('drops_grid.empty_state_message_others')}</Text>
              ) : (
                <>
                  <MaterialCommunityIcons
                    size={48}
                    name="clock"
                    color={colors.grey2}
                    style={styles.emptyStateIcon}
                  />
                  <Text style={styles.boldText}>
                    {I18n.t('drops_grid.empty_state_title')}
                  </Text>
                  <Text style={styles.centerText}>
                    {I18n.t('drops_grid.empty_state_message_mine')}
                  </Text>
                  <NBButton
                    block
                    dark
                    style={styles.searchButton}
                    onPress={() => navigation.navigate('createDrop')}>
                    <Text
                      // eslint-disable-next-line
                      style={{
                        fontSize: 16,
                        color: colors.white,
                      }}>
                      {I18n.t('drops_grid.empty_state_button_mine')}
                    </Text>
                  </NBButton>
                </>
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
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    alignSelf: 'center',
    marginBottom: 15,
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

export default connect(mapStateToProps)(UserDropsTabContainer);
