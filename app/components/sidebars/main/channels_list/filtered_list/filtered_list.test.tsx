// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {shallowWithIntl} from 'test/intl-test-helper';

import Preferences from '@mm-redux/constants/preferences';

import FilteredList from './filtered_list';

describe('ChannelsList FilteredList', () => {
    const baseProps = {
        actions: {
            getProfilesInTeam: jest.fn(),
            makeGroupMessageVisibleIfNecessary: jest.fn(),
            searchChannels: jest.fn(),
            searchProfiles: jest.fn(),
        },
        onSelectChannel: jest.fn(),
        testID: 'main.sidebar.channels_list.filtered_list',
        channels: {},
        currentTeam: {},
        currentUserId: 'current-user-id',
        currentChannel: {},
        groupChannelMemberDetails: {},
        teammateNameDisplay: 'teammate-name-display',
        otherChannels: [],
        archivedChannels: [],
        profiles: {},
        teamProfiles: {},
        searchOrder: [],
        pastDirectMessages: [],
        restrictDms: false,
        statuses: {},
        styles: {},
        term: 'term',
        theme: Preferences.THEMES.default,
        isLandscape: false,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(<FilteredList {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
