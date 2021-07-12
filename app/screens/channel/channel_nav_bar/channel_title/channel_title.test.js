// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {General} from '@mm-redux/constants';
import {shallowWithIntl} from '@test/intl-test-helper';

import ChannelTitle from './channel_title';

describe('ChannelTitle', () => {
    const baseProps = {
        displayName: 'My Channel',
        isGuest: false,
        hasGuests: false,
        canHaveSubtitle: false,
        isSelfDMChannel: false,
        customStatusEnabled: true,
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(
            <ChannelTitle {...baseProps}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when isSelfDMChannel is true', () => {
        const props = {
            ...baseProps,
            displayName: 'My User',
            isSelfDMChannel: true,
        };
        const wrapper = shallowWithIntl(
            <ChannelTitle {...props}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when is DM and has guests but the teammate is not the guest (when can show subtitles)', () => {
        const props = {
            ...baseProps,
            displayName: 'Other user',
            channelType: General.DM_CHANNEL,
            isGuest: false,
            hasGuests: true,
            canHaveSubtitle: true,
        };
        const wrapper = shallowWithIntl(
            <ChannelTitle {...props}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when is DM and has guests and the teammate is the guest (when can show subtitles)', () => {
        const props = {
            ...baseProps,
            displayName: 'Other user',
            channelType: General.DM_CHANNEL,
            isGuest: true,
            hasGuests: true,
            canHaveSubtitle: true,
        };
        const wrapper = shallowWithIntl(
            <ChannelTitle {...props}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot when isChannelShared is true', () => {
        const props = {
            ...baseProps,
            displayName: 'My User',
            isChannelShared: true,
            channelType: General.PRIVATE_CHANNEL,
        };
        const wrapper = shallowWithIntl(
            <ChannelTitle {...props}/>,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot with custom status emoji', () => {
        const wrapper = shallowWithIntl(
            <ChannelTitle
                {...baseProps}
                channelType={General.DM_CHANNEL}
            />,
        );

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
