// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {shallowWithIntl} from '@test/intl-test-helper';

import Archive from './archive';

jest.mock('@utils/theme', () => {
    const original = jest.requireActual('../../../utils/theme');
    return {
        ...original,
        changeOpacity: jest.fn(),
    };
});

describe('ChannelInfo -> Archive', () => {
    const baseProps = {
        canArchive: true,
        canUnarchive: false,
        channelId: '123',
        close: jest.fn(),
        deleteChannel: jest.fn(),
        displayName: 'Test Channel',
        getChannel: jest.fn(),
        handleSelectChannel: jest.fn(),
        isPublic: true,
        unarchiveChannel: jest.fn(),
        selectPenultimateChannel: jest.fn(),
        teamId: 'team-123',
        theme: Preferences.THEMES.default,
        viewArchivedChannels: true,
    };

    test('should match snapshot for Archive Channel', () => {
        const wrapper = shallowWithIntl(
            <Archive
                {...baseProps}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for Unarchive Channel', () => {
        const wrapper = shallowWithIntl(
            <Archive
                {...baseProps}
                canUnarchive={true}
            />,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot Not render Archive', () => {
        const wrapper = shallowWithIntl(
            <Archive
                {...baseProps}
                canArchive={false}
                canUnarchive={false}
            />,
        );
        expect(wrapper.getElement()).toBeNull();
    });
});
