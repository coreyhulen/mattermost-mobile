// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import apps from './apps';
import bots from './bots';
import channelCategories from './channel_categories';
import channels from './channels';
import emojis from './emojis';
import files from './files';
import general from './general';
import gifs from './gifs';
import groups from './groups';
import integrations from './integrations';
import posts from './posts';
import preferences from './preferences';
import remoteCluster from './remote_cluster';
import roles from './roles';
import search from './search';
import teams from './teams';
import typing from './typing';
import users from './users';

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
    remoteCluster,
    apps,
});
