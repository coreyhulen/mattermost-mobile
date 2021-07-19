// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import channels from './channels';
import general from './general';
import users from './users';
import teams from './teams';
import posts from './posts';
import files from './files';
import preferences from './preferences';
import typing from './typing';
import integrations from './integrations';
import emojis from './emojis';
import gifs from './gifs';
import search from './search';
import roles from './roles';
import groups from './groups';
import bots from './bots';
import channelCategories from './channel_categories';
import threads from './threads';
import remoteCluster from './remote_cluster';
import apps from './apps';

export default combineReducers({
    general,
    users,
    teams,
    channels,
    posts,
    files,
    preferences,
    typing,
    integrations,
    emojis,
    gifs,
    search,
    roles,
    groups,
    bots,
    channelCategories,
    threads,
    remoteCluster,
    apps,
});
