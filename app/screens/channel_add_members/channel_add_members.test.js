// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import * as NavigationActions from '@actions/navigation';
import {Preferences} from '@mm-redux/constants';
import {shallowWithIntl} from '@test/intl-test-helper';

import ChannelAddMembers from './channel_add_members';

describe('ChannelAddMembers', () => {
    const baseProps = {
        actions: {
            getTeamStats: jest.fn(),
            getProfilesNotInChannel: jest.fn().mockResolvedValue({}),
            handleAddChannelMembers: jest.fn().mockResolvedValue({}),
            searchProfiles: jest.fn().mockResolvedValue({data: []}),
        },
        currentChannelId: 'current_channel_id',
        currentTeamId: 'current_team_id',
        currentUserId: 'current_user_id',
        profilesNotInChannel: [],
        theme: Preferences.THEMES.default,
        componentId: 'component-id',
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    test('should render without error and call functions on mount', () => {
        const setButtons = jest.spyOn(NavigationActions, 'setButtons');

        shallowWithIntl(<ChannelAddMembers {...baseProps}/>);

        expect(baseProps.actions.getTeamStats).toBeCalledTimes(1);
        expect(baseProps.actions.getTeamStats).toBeCalledWith(baseProps.currentTeamId);

        const button = {enabled: false, id: 'add-members', text: 'Add', showAsAction: 'always'};
        expect(setButtons).toBeCalledTimes(2);
        expect(setButtons.mock.calls[0][0]).toEqual(baseProps.componentId, {rightButtons: [button]});
        expect(setButtons.mock.calls[1][0]).toEqual(baseProps.componentId, {rightButtons: [button]});
    });

    test('should match state on clearSearch', () => {
        const wrapper = shallowWithIntl(<ChannelAddMembers {...baseProps}/>);

        wrapper.setState({term: 'user', searchResults: [{id: '1', username: 'user-1'}]});

        wrapper.instance().clearSearch();
        wrapper.setState({term: '', searchResults: []});
    });

    test('should call popTopScreen on close', () => {
        const popTopScreen = jest.spyOn(NavigationActions, 'popTopScreen');

        const wrapper = shallowWithIntl(<ChannelAddMembers {...baseProps}/>);

        wrapper.instance().close();
        expect(popTopScreen).toBeCalledTimes(1);
    });

    test('should match state on onProfilesLoaded', () => {
        const wrapper = shallowWithIntl(<ChannelAddMembers {...baseProps}/>);
        const instance = wrapper.instance();

        instance.onProfilesLoaded({data: []});
        expect(instance.page).toBe(0);
        expect(instance.next).toBe(false);

        instance.next = true;
        wrapper.setState({loading: true});
        instance.onProfilesLoaded({data: [{id: 'user_id_1', username: 'username_1'}]});
        expect(instance.next).toBe(true);
        expect(instance.page).toBe(1);
        expect(wrapper.state('loading')).toBe(false);
    });
});
