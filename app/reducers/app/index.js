// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import build from './build';
import previousVersion from './previousVersion';
import version from './version';

export default combineReducers({
    build,
    version,
    previousVersion,
});
