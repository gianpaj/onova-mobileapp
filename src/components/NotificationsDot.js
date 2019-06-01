// @flow

import React from 'react';
import { connect } from 'react-redux';
import { Platform, StyleSheet } from 'react-native';
// import UserAvatar from 'react-native-user-avatar';

import type { ReduxState, UserData } from '../types';
import { Avatar } from '../components';

type Props = {
  focused: boolean,
  userData: UserData,
};

function NotificationsDot({ userData, focused }: Props) {
  // textColor
  // imageStyle
  // defaultName
  // if (skippedLogin) {
  //   const color = APP_NAME === 'onova' ? colors.black : colors.redDrop;
  //   return (
  //     <UserAvatar
  //       color={color}
  //       size="30"
  //       fontDecrease={2}
  //       name={APP_NAME.slice(0, 1).toUpperCase()}
  //       containerStyle={focused ? { borderColor: colors.grey5 } : {}}
  //     />
  //   );
  // }

  if (!userData) return null;

  return (
    <Avatar
      style={styles.avatarContainer}
      size="verySmall"
      withBorder={focused}
      uri={userData.profilePic}
      placeholderText={userData.username}
    />
  );
  // <View style={st.iconContainer}>
  /* {userData.notifications && <View style={st.dot} />} */
  /* https://docs.nativebase.io/Components.html#footer-tabs-badge-headref */
  /* <Button active badge vertical>
      <Badge ><Text>51</Text></Badge>
      <Icon active name="navigate" />
      <Text>Navigate</Text>
    </Button> */
  // </View>
}

const styles = StyleSheet.create({
  // iconContainer: {
  //   zIndex: 0,
  //   flex: 1,
  //   alignSelf: 'stretch',
  //   justifyContent: 'space-around',
  //   alignItems: 'center',
  // },
  // dot: {
  //   backgroundColor: colors.red,
  //   borderRadius: 15,
  //   bottom: 5,
  //   height: 4,
  //   left: 9,
  //   minWidth: 4,
  //   position: 'absolute',
  //   zIndex: 2,
  // },
  avatarContainer: {
    borderRadius: Platform.select({
      ios: 25 / 2,
      android: 20,
    }),
    height: 25,
    width: 25,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export default connect(mapStateToProps)(React.memo(NotificationsDot));
