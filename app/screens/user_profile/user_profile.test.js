// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import * as NavigationActions from '@actions/navigation';
import {BotTag, GuestTag} from '@components/tag';
import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import UserProfile from './user_profile.js';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('user_profile', () => {
    const actions = {
        setChannelDisplayName: jest.fn(),
        makeDirectChannel: jest.fn(),
        loadBot: jest.fn(),
        getRemoteClusterInfo: jest.fn(),
        unsetCustomStatus: jest.fn(),
    };
    const baseProps = {
        actions,
        config: {
            ShowEmailAddress: true,
        },
        teammateNameDisplay: 'username',
        teams: [],
        theme: Preferences.THEMES.default,
        enableTimezone: false,
        isMilitaryTime: false,
        isMyUser: false,
        componentId: 'component-id',
    };

    const user = {
        email: 'test@test.com',
        first_name: 'test',
        id: '4hzdnk6mg7gepe7yze6m3domnc',
        last_name: 'fake',
        nickname: 'nick',
        username: 'fred',
        is_bot: false,
    };

    const customStatus = {
        emoji: 'calendar',
        text: 'In a meeting',
    };

    const customStatusProps = {
        ...baseProps,
        customStatus,
        config: {
            EnableCustomUserStatuses: 'true',
        },
        user,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <UserProfile
                {...baseProps}
                user={user}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot with custom status', () => {
        const wrapper = shallowWithIntl(
            <UserProfile
                {...customStatusProps}
            />,
            {context: {intl: {formatMessage: jest.fn()}}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot with custom status and isMyUser true', () => {
        const wrapper = shallowWithIntl(
            <UserProfile
                {...customStatusProps}
                isMyUser={true}
            />,
            {context: {intl: {formatMessage: jest.fn()}}},
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should contain bot tag', () => {
        const botUser = {
            email: 'test@test.com',
            first_name: 'test',
            id: '4hzdnk6mg7gepe7yze6m3domnc',
            last_name: 'fake',
            nickname: 'nick',
            username: 'fred',
            is_bot: true,
        };

        const wrapper = shallowWithIntl(
            <UserProfile
                {...baseProps}
                user={botUser}
            />,
        );
        expect(wrapper.containsMatchingElement(
            <BotTag
                show={true}
                theme={baseProps.theme}
            />,
        )).toEqual(true);
    });

    test('should contain guest tag', () => {
        const guestUser = {
            email: 'test@test.com',
            first_name: 'test',
            id: '4hzdnk6mg7gepe7yze6m3domnc',
            last_name: 'fake',
            nickname: 'nick',
            username: 'fred',
            roles: 'system_guest',
        };

        const wrapper = shallowWithIntl(
            <UserProfile
                {...baseProps}
                user={guestUser}
            />,
        );
        expect(wrapper.containsMatchingElement(
            <GuestTag
                show={true}
                theme={baseProps.theme}
            />,
        )).toEqual(true);
    });

    test('should push EditProfile', () => {
        jest.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => cb());
        const goToScreen = jest.spyOn(NavigationActions, 'goToScreen');

        const wrapper = shallowWithIntl(
            <UserProfile
                {...baseProps}
                user={user}
            />,
        );

        wrapper.instance().goToEditProfile();
        expect(goToScreen).toHaveBeenCalledTimes(1);
    });

    test('should match snapshot when user is from remote', () => {
        const remoteUser = {
            ...user,
            remote_id: 'sr23g5h456',
        };
        const clusterInfo = {
            display_name: 'Remote Organization',
        };
        const wrapper = shallowWithIntl(
            <UserProfile
                {...baseProps}
                remoteClusterInfo={clusterInfo}
                user={remoteUser}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should call goToEditProfile', () => {
        const goToScreen = jest.spyOn(NavigationActions, 'goToScreen');

        const wrapper = shallowWithIntl(
            <UserProfile
                {...baseProps}
                user={user}
            />,
        );

        const event = {buttonId: wrapper.instance().rightButton.id};
        wrapper.instance().navigationButtonPressed(event);
        expect(goToScreen).toHaveBeenCalledTimes(1);
    });

    test('should call close', () => {
        const dismissModal = jest.spyOn(NavigationActions, 'dismissModal');
        const wrapper = shallowWithIntl(
            <UserProfile
                {...baseProps}
                user={user}
            />,
        );

        const close = jest.spyOn(wrapper.instance(), 'close');
        const event = {buttonId: 'close-settings'};
        wrapper.instance().navigationButtonPressed(event);
        expect(close).toHaveBeenCalledTimes(1);
        expect(dismissModal).toHaveBeenCalledTimes(1);
    });
});
