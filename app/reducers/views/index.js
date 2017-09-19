// Copyright (c) 2016-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import {combineReducers} from 'redux';

import channel from './channel';
import fetchCache from './fetch_cache';
import i18n from './i18n';
import login from './login';
import notification from './notification';
import root from './root';
import search from './search';
import selectServer from './select_server';
import team from './team';
import thread from './thread';

export default combineReducers({
    channel,
    fetchCache,
    i18n,
    login,
    notification,
    root,
    search,
    selectServer,
    team,
    thread
});
