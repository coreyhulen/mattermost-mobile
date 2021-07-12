// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-import-assign */

import {Permissions} from '@mm-redux/constants';
import * as channelSelectors from '@mm-redux/selectors/entities/channels';
import * as preferenceSelectors from '@mm-redux/selectors/entities/preferences';
import * as roleSelectors from '@mm-redux/selectors/entities/roles';
import {isMinimumServerVersion} from '@mm-redux/utils/helpers';

import {mapStateToProps} from './index';

jest.mock('./post_draft', () => ({
    __esModule: true,
    default: jest.fn(),
}));

channelSelectors.getCurrentChannel = jest.fn().mockReturnValue({});
channelSelectors.isCurrentChannelReadOnly = jest.fn();
preferenceSelectors.getTheme = jest.fn();
roleSelectors.haveIChannelPermission = jest.fn();

describe('mapStateToProps', () => {
    const baseState = {
        entities: {
            general: {
                config: {},
                serverVersion: '',
            },
            users: {
                profiles: {},
                currentUserId: '',
            },
            channels: {
                currentChannelId: '',
                channelMemberCountsByGroup: {},
                channels: {},
            },
            preferences: {
                myPreferences: {},
            },
            teams: {
                teams: {},
            },
        },
        views: {
            channel: {
                drafts: {},
            },
        },
        requests: {
            files: {
                uploadFiles: {
                    status: '',
                },
            },
        },
    };

    const baseOwnProps = {};

    test('haveIChannelPermission is not called when isMinimumServerVersion is not 5.22v', () => {
        const state = {...baseState};
        state.entities.general.serverVersion = '5.21';

        mapStateToProps(state, baseOwnProps);
        expect(isMinimumServerVersion(state.entities.general.serverVersion, 5, 22)).toBe(false);

        expect(roleSelectors.haveIChannelPermission).not.toHaveBeenCalledWith(state, {
            channel: undefined,
            team: undefined,
            permission: Permissions.CREATE_POST,
            default: true,
        });

        expect(roleSelectors.haveIChannelPermission).not.toHaveBeenCalledWith(state, {
            channel: undefined,
            permission: Permissions.USE_CHANNEL_MENTIONS,
            default: true,
        });
    });

    test('haveIChannelPermission is called when isMinimumServerVersion is 5.22v', () => {
        const state = {...baseState};
        state.entities.general.serverVersion = '5.22';

        mapStateToProps(state, baseOwnProps);
        expect(isMinimumServerVersion(state.entities.general.serverVersion, 5, 22)).toBe(true);

        expect(roleSelectors.haveIChannelPermission).toHaveBeenCalledWith(state, {
            channel: undefined,
            team: undefined,
            permission: Permissions.CREATE_POST,
            default: true,
        });
    });

    test('haveIChannelPermission is not called when isMinimumServerVersion is 5.22v but currentChannel is null', () => {
        channelSelectors.getCurrentChannel = jest.fn().mockReturnValue(null);

        const state = {...baseState};
        state.entities.general.serverVersion = '5.22';

        mapStateToProps(state, baseOwnProps);
        expect(isMinimumServerVersion(state.entities.general.serverVersion, 5, 22)).toBe(true);

        expect(roleSelectors.haveIChannelPermission).not.toHaveBeenCalledWith(state, {
            channel: undefined,
            team: undefined,
            permission: Permissions.CREATE_POST,
        });

        expect(roleSelectors.haveIChannelPermission).not.toHaveBeenCalledWith(state, {
            channel: undefined,
            permission: Permissions.USE_CHANNEL_MENTIONS,
        });
    });
});
