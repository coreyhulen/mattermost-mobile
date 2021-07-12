// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {shallow} from 'enzyme';
import React from 'react';

import {Client4} from '@client/rest';
import Preferences from '@mm-redux/constants/preferences';

import ProfilePictureButton from './profile_picture_button.js';

describe('profile_picture_button', () => {
    const baseProps = {
        theme: Preferences.THEMES.default,
        currentUser: {
            first_name: 'Dwight',
            last_name: 'Schrute',
            username: 'ieatbeets',
            email: 'dwight@schrutefarms.com',
            nickname: 'Dragon',
            position: 'position',
        },
        maxFileSize: 20 * 1024 * 1024,
        uploadFiles: jest.fn(),
    };

    test('should match snapshot', async () => {
        const wrapper = shallow(
            <ProfilePictureButton {...baseProps}/>,
        );
        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should NOT return option to remove when profile picture is default', () => {
        Client4.getProfilePictureUrl = jest.fn(() => 'image.png');
        const wrapper = shallow(
            <ProfilePictureButton {...baseProps}/>,
        );
        const instance = wrapper.instance();

        // test default image (WITHOUT query param)
        instance.getRemoveProfileImageOption();
        expect(wrapper.state('extraOptions')).toEqual([null]);
    });

    test('should return option to remove profile picture if customized', () => {
        Client4.getProfilePictureUrl = jest.fn(() => 'image.png?query');
        const wrapper = shallow(
            <ProfilePictureButton {...baseProps}/>,
        );
        const instance = wrapper.instance();

        // test custom image (WITH query param)
        instance.getRemoveProfileImageOption();
        expect(wrapper.state('extraOptions')).not.toEqual([null]);
    });
});
