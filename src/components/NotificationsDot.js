// @flow

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { connect } from 'react-redux';

// eslint-disable-next-line
import type { ReduxState } from '../types';
import colors from '../config/colors';
import { Avatar } from '../components';

type Props = {
  focused: boolean,
  userData: any,
};

class NotificationsDot extends React.Component<Props, void> {
  shouldComponentUpdate(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) {
      return false;
    }
    return true;
  }

  render() {
    const { userData, focused } = this.props;
    userData.notifications = false;

    return (
      <View style={st.iconContainer}>
        {userData.notifications && <View style={st.dot} />}
        <Avatar
          style={st.avatarContainer}
          size={'verySmall'}
          withBorder={focused}
          uri={userData.profilePic}
          placeholderText={userData.username}
        />
        {/* https://docs.nativebase.io/Components.html#footer-tabs-badge-headref */}
        {/* <Button active badge vertical>
          <Badge ><Text>51</Text></Badge>
          <Icon active name="navigate" />
          <Text>Navigate</Text>
        </Button> */}
      </View>
    );
  }
}

const st = StyleSheet.create({
  iconContainer: {
    zIndex: 0,
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: colors.red,
    borderRadius: 15,
    bottom: 5,
    height: 4,
    left: 9,
    minWidth: 4,
    position: 'absolute',
    zIndex: 2,
  },
  avatarContainer: {
    height: 25,
    width: 25,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(NotificationsDot);
