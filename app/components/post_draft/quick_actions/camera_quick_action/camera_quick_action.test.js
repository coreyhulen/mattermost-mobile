// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';

import React from 'react';
import {Alert} from 'react-native';
import Permissions from 'react-native-permissions';

import * as Navigation from '@actions/navigation';
import Preferences from '@mm-redux/constants/preferences';
import {renderWithIntl} from '@test/testing_library';

import CameraQuickAction from './index';

jest.mock('react-native-image-picker', () => ({
    launchCamera: jest.fn().mockImplementation((options, callback) => callback({didCancel: true})),
}));

describe('CameraButton', () => {
    const baseProps = {
        disabled: false,
        testID: 'post_draft.quick_actions.camera_action',
        fileCount: 0,
        maxFileCount: 5,
        theme: Preferences.THEMES.default,
        onUploadFiles: jest.fn(),
    };

    test('should match snapshot', () => {
        const wrapper = renderWithIntl(<CameraQuickAction {...baseProps}/>);

        expect(wrapper.toJSON()).toMatchSnapshot();
    });

    test('should return permission false if permission is denied in iOS', async () => {
        const showModalOverCurrentContext = jest.spyOn(Navigation, 'showModalOverCurrentContext');
        jest.spyOn(Permissions, 'request').mockReturnValue(Permissions.RESULTS.DENIED);

        const wrapper = renderWithIntl(
            <CameraQuickAction {...baseProps}/>,
        );

        fireEvent.press(wrapper.getByTestId(baseProps.testID));
        await expect(showModalOverCurrentContext).toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
    });
});
