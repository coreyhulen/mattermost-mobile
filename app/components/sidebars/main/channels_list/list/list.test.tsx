// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {shallow} from 'enzyme';

import Preferences from '@mm-redux/constants/preferences';

import List from './list';

describe('ChannelsList List', () => {
    const baseProps = {
        onSelectChannel: jest.fn(),
        testID: 'main.sidebar.channels_list.list',
        canJoinPublicChannels: true,
        canCreatePrivateChannels: true,
        canCreatePublicChannels: true,
        favoriteChannelIds: [],
        unreadChannelIds: [],
        styles: {},
        theme: Preferences.THEMES.default,
        orderedChannelIds: [],
        isLandscape: false,
    };

    test('should match snapshot', () => {
        const wrapper = shallow(<List {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
