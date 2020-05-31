// @flow
import Sendbird from 'sendbird';

import type { Dispatch } from '../types';
import * as ACTION_TYPES from './actionTypes';

export const channelExit = (channelUrl: string) => (dispatch: Dispatch): Promise<boolean> => {
  const sb = Sendbird.getInstance();
  sb.removeChannelHandler(channelUrl);
  dispatch({ type: ACTION_TYPES.CHANNEL_EXIT_SUCCESS });
  return Promise.resolve(true);
};
