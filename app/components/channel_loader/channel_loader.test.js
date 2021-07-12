// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import ChannelLoader from './channel_loader';

jest.useFakeTimers();

describe('ChannelLoader', () => {
    const baseProps = {
        channelIsLoading: true,
        theme: Preferences.THEMES.default,
    };

    test('should match snapshot', () => {
        const wrapper = shallow(<ChannelLoader {...baseProps}/>);
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should call setTimeout and setInterval for showIndicator and retryLoad on mount', () => {
        shallow(<ChannelLoader {...baseProps}/>);
        expect(setTimeout).not.toHaveBeenCalled();
        expect(setInterval).not.toHaveBeenCalled();

        const props = {
            ...baseProps,
            retryLoad: jest.fn(),
        };
        const wrapper = shallow(<ChannelLoader {...props}/>);
        const instance = wrapper.instance();
        expect(setTimeout).toHaveBeenCalledWith(instance.showIndicator, 10000);
        expect(setInterval).toHaveBeenCalledWith(props.retryLoad, 10000);
    });

    test('should clear timer and interval on unmount', () => {
        const props = {
            ...baseProps,
            retryLoad: jest.fn(),
        };
        const wrapper = shallow(<ChannelLoader {...props}/>);
        const instance = wrapper.instance();
        instance.componentWillUnmount();

        expect(clearTimeout).toHaveBeenCalledWith(instance.stillLoadingTimeout);
        expect(clearInterval).toHaveBeenCalledWith(instance.retryLoadInterval);
    });
});
