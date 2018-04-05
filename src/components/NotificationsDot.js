// @flow

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { connect } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';

import type { ReduxState } from '../types';
import colors from '../config/colors';

const isiOS = Platform.OS === 'ios';

type Props = {
  focused: boolean,
  userData: any,
};

class NotificationsDot extends React.Component<Props, void> {
  shouldComponentUpdate(nextProps) {
    // fix error when logging out
    if (!nextProps.userData) {
      return false;
    } else {
      return true;
    }
  }

  render() {
    const { userData, focused } = this.props;
    userData.notifications = false;

    return (
      <View style={st.iconContainer}>
        {userData.notifications && <View style={st.dot} />}
        <Ionicons
          // name={isiOS ? `ios-person${focused ? '' : '-outline'}` : 'md-person'}
          name={isiOS ? 'ios-person' : 'md-person'}
          size={28}
          // eslint-disable-next-line
          style={{ marginBottom: -3 }}
          color={
            focused ? (isiOS ? colors.active : colors.grey1) : colors.grey1
          }
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
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(NotificationsDot);
