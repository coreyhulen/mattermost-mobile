// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {getStatusColors} from '@utils/message_attachment_colors';
import {changeOpacity} from '@utils/theme';

import ActionButton from './action_button';

describe('ActionButton', () => {
    test('correct styles when from global theme', () => {
        const buttonConfig = {
            id: 'gpc1tihowfabfmmcizddo',
            name: 'Option 1',
            style: 'onlineIndicator',
        };

        const baseProps = {
            id: buttonConfig.id,
            cookie: '',
            name: buttonConfig.name,
            postId: buttonConfig.id,
            buttonColor: buttonConfig.style,
            theme: Preferences.THEMES.default,
            doPostActionWithCookie: jest.fn(),
        };

        const wrapper = shallow(<ActionButton {...baseProps}/>);

        const buttonTextChild = wrapper.getElement().props.children;
        const dynamicButtonStyles = wrapper.getElement().props.containerStyle[1];

        expect(dynamicButtonStyles.borderColor).toBe(changeOpacity(Preferences.THEMES.default[buttonConfig.style], 0.25));
        expect(buttonTextChild.props.style.color).toBe(Preferences.THEMES.default[buttonConfig.style]);
    });

    test('correct styles when a status color', () => {
        const buttonConfig = {
            id: 'gpc1tihowbfmmcizofm7zhr1to',
            name: 'Option 2',
            style: 'danger',
        };

        const baseProps = {
            id: buttonConfig.id,
            cookie: '',
            name: buttonConfig.name,
            postId: buttonConfig.id,
            buttonColor: buttonConfig.style,
            theme: Preferences.THEMES.default,
            doPostActionWithCookie: jest.fn(),
        };

        const wrapper = shallow(<ActionButton {...baseProps}/>);

        const buttonTextChild = wrapper.getElement().props.children;
        const dynamicButtonStyles = wrapper.getElement().props.containerStyle[1];

        const STATUS_COLORS = getStatusColors(Preferences.THEMES.default);
        expect(dynamicButtonStyles.borderColor).toBe(changeOpacity(STATUS_COLORS[buttonConfig.style], 0.25));
        expect(buttonTextChild.props.style.color).toBe(STATUS_COLORS[buttonConfig.style]);
    });

    test('correct styles when a hex style', () => {
        const buttonConfig = {
            id: 'gpc1tihowbfawemmcizddo',
            name: 'Option 3',
            style: '#166de0',
        };

        const baseProps = {
            id: buttonConfig.id,
            cookie: '',
            name: buttonConfig.name,
            postId: buttonConfig.id,
            buttonColor: buttonConfig.style,
            theme: Preferences.THEMES.default,
            doPostActionWithCookie: jest.fn(),
        };

        const wrapper = shallow(<ActionButton {...baseProps}/>);

        const buttonTextChild = wrapper.getElement().props.children;
        const dynamicButtonStyles = wrapper.getElement().props.containerStyle[1];

        expect(dynamicButtonStyles.borderColor).toBe(changeOpacity(buttonConfig.style, 0.25));
        expect(buttonTextChild.props.style.color).toBe(buttonConfig.style);
    });

    test('correct default styles', () => {
        const buttonConfig = {
            id: 'gpc1tihowbfawemmcizddo',
            name: 'Option 4',
        };

        const baseProps = {
            id: buttonConfig.id,
            cookie: '',
            name: buttonConfig.name,
            postId: buttonConfig.id,
            theme: Preferences.THEMES.default,
            doPostActionWithCookie: jest.fn(),
        };

        const wrapper = shallow(<ActionButton {...baseProps}/>);

        const buttonTextChild = wrapper.getElement().props.children;
        const baseButtonStyles = wrapper.getElement().props.containerStyle[0];
        const dynamicButtonStyles = wrapper.getElement().props.containerStyle[1];

        expect(baseButtonStyles.borderColor).toBe(changeOpacity(Preferences.THEMES.default.centerChannelColor, 0.25));
        expect(baseButtonStyles.borderWidth).toBe(2);
        expect(baseButtonStyles.borderRadius).toBe(4);
        expect(dynamicButtonStyles).toBe(undefined);
        expect(buttonTextChild.props.style.color).toBe(Preferences.THEMES.default.centerChannelColor);
    });
});
