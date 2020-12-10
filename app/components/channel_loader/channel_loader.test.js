// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {shallow} from 'enzyme';

import Preferences from '@mm-redux/constants/preferences';

import ChannelLoader from './channel_loader';

describe('ChannelLoader', () => {
    const baseProps = {
        channelIsLoading: true,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallow(<ChannelLoader {...baseProps}/>);
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});
