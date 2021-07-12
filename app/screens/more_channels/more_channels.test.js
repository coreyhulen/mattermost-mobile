// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import * as NavigationActions from '@actions/navigation';
import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import MoreChannels from './more_channels.js';

describe('MoreChannels', () => {
    const actions = {
        handleSelectChannel: jest.fn(),
        joinChannel: jest.fn(),
        getArchivedChannels: jest.fn().mockResolvedValue({data: [{id: 'id2', name: 'name2', display_name: 'display_name2', delete_at: 123}]}),
        getChannels: jest.fn().mockResolvedValue({data: [{id: 'id', name: 'name', display_name: 'display_name'}]}),
        getSharedChannels: jest.fn().mockResolvedValue({data: [{id: 'id3', name: 'shared_channel', display_name: 'shared_channel_name', shared: true}]}),
        searchChannels: jest.fn(),
        setChannelDisplayName: jest.fn(),
    };

    const baseProps = {
        actions,
        canCreateChannels: true,
        channels: [{id: 'id', name: 'name', display_name: 'display_name'}],
        sharedChannels: [{id: 'id3', name: 'shared_channel', display_name: 'shared_channel_name'}],
        archivedChannels: [{id: 'id2', name: 'archived', display_name: 'archived channel', delete_at: 123}],
        closeButton: {},
        currentUserId: 'current_user_id',
        currentTeamId: 'current_team_id',
        theme: Preferences.THEMES.default,
        componentId: 'component-id',
        canShowArchivedChannels: true,
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should call dismissModal on close', () => {
        const dismissModal = jest.spyOn(NavigationActions, 'dismissModal');

        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );

        wrapper.instance().close();
        expect(dismissModal).toHaveBeenCalledTimes(1);
    });

    test('should call setButtons on setHeaderButtons', () => {
        const setButtons = jest.spyOn(NavigationActions, 'setButtons');

        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );

        expect(setButtons).toHaveBeenCalledTimes(1);
        wrapper.instance().setHeaderButtons(true);
        expect(setButtons).toHaveBeenCalledTimes(2);
    });

    test('should match return value of filterChannels', () => {
        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );

        const channels = [{id: 'id', name: 'name', display_name: 'display_name'}];
        expect(wrapper.instance().filterChannels(channels, 'name')).toEqual([channels[0]]);
        expect(wrapper.instance().filterChannels(channels, 'display_name')).toEqual([channels[0]]);
        expect(wrapper.instance().filterChannels(channels, 'none')).toEqual([]);
        expect(wrapper.instance().filterChannels(channels, 'display_none')).toEqual([]);
    });

    test('should match state on cancelSearch', () => {
        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );

        wrapper.setState({term: 'term'});
        wrapper.instance().cancelSearch(true);
        expect(wrapper.state('term')).toEqual('');
        expect(wrapper.state('channels')).toEqual(baseProps.channels);
    });

    test('should search correct channels', () => {
        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );
        const instance = wrapper.instance();

        wrapper.setState({typeOfChannels: 'public'});
        instance.searchChannels('display_name');
        expect(wrapper.state('channels')).toEqual(baseProps.channels);

        wrapper.setState({typeOfChannels: 'archived'});
        instance.searchChannels('archived channel');
        expect(wrapper.state('archivedChannels')).toEqual(baseProps.archivedChannels);

        wrapper.setState({typeOfChannels: 'shared'});
        instance.searchChannels('shared');
        expect(wrapper.state('sharedChannels')).toEqual(baseProps.sharedChannels);
    });

    test('Allow load more public channels', () => {
        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );
        const instance = wrapper.instance();
        wrapper.setState({typeOfChannels: 'public'});
        instance.loadedChannels({data: ['channel-1', 'channel-2']});
        expect(instance.nextPublic).toBe(true);
    });

    test('Prevent load more public channels', () => {
        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );
        const instance = wrapper.instance();
        wrapper.setState({typeOfChannels: 'public'});
        instance.loadedChannels({data: null});
        expect(instance.nextPublic).toBe(false);

        instance.loadedChannels({data: []});
        expect(instance.nextPublic).toBe(false);
    });

    test('Allow load more archived channels', () => {
        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );
        const instance = wrapper.instance();
        wrapper.setState({typeOfChannels: 'archived'});
        instance.loadedChannels({data: ['archived-1', 'archived-2']});
        expect(instance.nextArchived).toBe(true);
    });

    test('Prevent load more archived channels', () => {
        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );
        const instance = wrapper.instance();
        wrapper.setState({typeOfChannels: 'archived'});
        instance.loadedChannels({data: null});
        expect(instance.nextArchived).toBe(false);

        instance.loadedChannels({data: []});
        expect(instance.nextArchived).toBe(false);
    });

    test('Allow load more shared channels', () => {
        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );
        const instance = wrapper.instance();
        wrapper.setState({typeOfChannels: 'shared'});
        instance.loadedChannels({data: ['shared-1', 'shared-2']});
        expect(instance.nextShared).toBe(true);
    });

    test('Prevent load more shared channels', () => {
        const wrapper = shallowWithIntl(
            <MoreChannels {...baseProps}/>,
        );
        const instance = wrapper.instance();
        wrapper.setState({typeOfChannels: 'shared'});
        instance.loadedChannels({data: null});
        expect(instance.nextShared).toBe(false);

        instance.loadedChannels({data: []});
        expect(instance.nextShared).toBe(false);
    });
});
