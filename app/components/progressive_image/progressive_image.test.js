// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {shallow} from 'enzyme';
import React from 'react';

import Preferences from '@mm-redux/constants/preferences';

import ProgressiveImage from './progressive_image';

jest.useFakeTimers();

describe('ProgressiveImage', () => {
    test('should match snapshot for Image', () => {
        const baseProps = {
            isBackgroundImage: false,
            imageUri: 'https://images.com/image.png',
            onError: jest.fn(),
            resizeMethod: 'auto',
            resizeMode: 'contain',
            theme: Preferences.THEMES.default,
            tintDefaultSource: false,
            defaultSource: undefined,
        };

        const wrapper = shallow(<ProgressiveImage {...baseProps}/>);
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for Default Image', () => {
        const baseProps = {
            isBackgroundImage: false,
            defaultSource: 'https://images.com/image.png',
            onError: jest.fn(),
            resizeMethod: 'auto',
            resizeMode: 'contain',
            theme: Preferences.THEMES.default,
            tintDefaultSource: false,
        };

        const wrapper = shallow(<ProgressiveImage {...baseProps}/>);
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should match snapshot for BackgroundImage', () => {
        const baseProps = {
            isBackgroundImage: true,
            imageUri: 'https://images.com/image.png',
            onError: jest.fn(),
            resizeMethod: 'auto',
            resizeMode: 'contain',
            theme: Preferences.THEMES.default,
            tintDefaultSource: false,
            defaultSource: null,
        };

        const wrapper = shallow(<ProgressiveImage {...baseProps}/>);
        expect(wrapper.getElement()).toMatchSnapshot();
    });
});

describe('MiniPreview', () => {
    test('should show mini preview when supported & image not in viewport', () => {
        const baseProps = {
            isBackgroundImage: false,
            imageUri: 'https://images.com/image.png',
            onError: jest.fn(),
            resizeMethod: 'auto',
            resizeMode: 'contain',
            theme: Preferences.THEMES.default,
            tintDefaultSource: false,
            defaultSource: null,
            inViewPort: false,
            thumbnailUri: 'somebase64data',
        };
        const wrapper = shallow(<ProgressiveImage {...baseProps}/>);
        expect(wrapper.find({testID: 'progressive_image.miniPreview'}).length).toEqual(1);
    });

    test('should load and show high res image with animation when component comes into viewport', () => {
        const baseProps = {
            isBackgroundImage: false,
            imageUri: 'https://images.com/image.png',
            onError: jest.fn(),
            resizeMethod: 'auto',
            resizeMode: 'contain',
            theme: Preferences.THEMES.default,
            tintDefaultSource: false,
            defaultSource: null,
            inViewPort: false,
            thumbnailUri: 'somebase64data',
        };
        const wrapper = shallow(<ProgressiveImage {...baseProps}/>);
        const selectHighResImage = () => wrapper.find({testID: 'progressive_image.highResImage'});
        expect(selectHighResImage().length).toEqual(0);
        wrapper.setProps({
            inViewPort: true,
        });
        expect(selectHighResImage().length).toEqual(1);
    });
});
