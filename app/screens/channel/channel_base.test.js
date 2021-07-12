// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Alert} from 'react-native';

import * as NavigationActions from '@actions/navigation';
import {General, Preferences} from '@mm-redux/constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import EphemeralStore from '@store/ephemeral_store';
import {shallowWithIntl} from '@test/intl-test-helper';
import {emptyFunction} from '@utils/general';

import ChannelBase from './channel_base';

describe('ChannelBase', () => {
    const channelBaseComponentId = 'component-0';
    const componentIds = ['component-1', 'component-2', 'component-3'];
    const baseProps = {
        actions: {
            getChannelStats: jest.fn(),
            loadChannelsForTeam: jest.fn(),
            markChannelViewedAndRead: jest.fn(),
            selectDefaultTeam: jest.fn(),
            selectInitialChannel: jest.fn(),
        },
        componentId: channelBaseComponentId,
        theme: Preferences.THEMES.default,
    };
    const optionsForTheme = (theme) => {
        return {
            topBar: {
                backButton: {
                    color: theme.sidebarHeaderTextColor,
                },
                background: {
                    color: theme.sidebarHeaderBg,
                },
                title: {
                    color: theme.sidebarHeaderTextColor,
                },
                leftButtonColor: theme.sidebarHeaderTextColor,
                rightButtonColor: theme.sidebarHeaderTextColor,
            },
            layout: {
                componentBackgroundColor: theme.centerChannelBg,
            },
        };
    };

    test('should call mergeNavigationOptions on all navigation components when theme changes', () => {
        const mergeNavigationOptions = jest.spyOn(NavigationActions, 'mergeNavigationOptions');

        EphemeralStore.addNavigationComponentId(channelBaseComponentId);
        componentIds.forEach((componentId) => {
            EphemeralStore.addNavigationComponentId(componentId);
        });

        const wrapper = shallowWithIntl(
            <ChannelBase {...baseProps}/>,
        );

        expect(mergeNavigationOptions.mock.calls).toEqual([]);
        mergeNavigationOptions.mockClear();

        wrapper.setProps({theme: Preferences.THEMES.mattermostDark});

        const newThemeOptions = optionsForTheme(Preferences.THEMES.mattermostDark);
        expect(mergeNavigationOptions.mock.calls).toEqual([
            [baseProps.componentId, newThemeOptions],
            [componentIds[2], newThemeOptions],
            [componentIds[1], newThemeOptions],
            [componentIds[0], newThemeOptions],
        ]);
    });

    test('registerTypingAnimation should return a callback that removes the typing animation', () => {
        const wrapper = shallowWithIntl(
            <ChannelBase {...baseProps}/>,
        );

        const instance = wrapper.instance();
        expect(instance.typingAnimations).toStrictEqual([]);

        const removeAnimation = instance.registerTypingAnimation(emptyFunction);
        expect(instance.typingAnimations).toStrictEqual([emptyFunction]);

        removeAnimation();
        expect(instance.typingAnimations).toStrictEqual([]);
    });

    test('should display an alert when the user is removed from the current channel', () => {
        const alert = jest.spyOn(Alert, 'alert');
        shallowWithIntl(
            <ChannelBase {...baseProps}/>,
        );

        EventEmitter.emit(General.REMOVED_FROM_CHANNEL);
        expect(alert).toHaveBeenCalled();
    });

    test('should call selectDefault team when the current team is archived', () => {
        const wrapper = shallowWithIntl(
            <ChannelBase {...baseProps}/>,
        );

        wrapper.setProps({currentTeamId: '', currentChannelId: ''});
        expect(baseProps.actions.selectDefaultTeam).toHaveBeenCalledTimes(1);
    });
});
