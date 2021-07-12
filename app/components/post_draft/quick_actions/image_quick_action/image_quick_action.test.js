// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';

import React from 'react';
import {Alert, Platform, StatusBar} from 'react-native';
import Permissions from 'react-native-permissions';

import Preferences from '@mm-redux/constants/preferences';
import {renderWithIntl} from '@test/testing_library';
import * as PermissionUtils from '@utils/permission';

import ImageQuickAction from './index';

jest.mock('react-native-image-picker', () => ({
    launchImageLibrary: jest.fn().mockImplementation((options, callback) => callback({didCancel: true})),
}));

describe('ImageQuickAction', () => {
    const baseProps = {
        disabled: false,
        testID: 'post_draft.quick_actions.image_action',
        fileCount: 0,
        maxFileCount: 5,
        theme: Preferences.THEMES.default,
        onUploadFiles: jest.fn(),
    };

    test('should match snapshot', () => {
        const wrapper = renderWithIntl(<ImageQuickAction {...baseProps}/>);

        expect(wrapper.toJSON()).toMatchSnapshot();
    });

    test('should return permission false if permission is denied in iOS', async () => {
        jest.spyOn(Permissions, 'check').mockReturnValue(Permissions.RESULTS.UNAVAILABLE);
        jest.spyOn(Permissions, 'request').mockReturnValue(Permissions.RESULTS.DENIED);

        const wrapper = renderWithIntl(
            <ImageQuickAction {...baseProps}/>,
        );

        fireEvent.press(wrapper.getByTestId(baseProps.testID));
        await expect(Permissions.check).toHaveBeenCalled();
        await expect(Permissions.request).toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    test('should show permission denied alert and return permission false if permission is blocked in iOS', async () => {
        jest.spyOn(Permissions, 'check').mockReturnValue(Permissions.RESULTS.BLOCKED);
        jest.spyOn(Alert, 'alert').mockReturnValue(true);

        const wrapper = renderWithIntl(
            <ImageQuickAction {...baseProps}/>,
        );

        fireEvent.press(wrapper.getByTestId(baseProps.testID));
        await expect(Permissions.check).toHaveBeenCalled();
        await expect(Permissions.request).not.toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalled();
    });

    test('hasPhotoPermission returns true when permission has been granted', async () => {
        const platformPermissions = [{
            platform: 'ios',
            permission: Permissions.PERMISSIONS.IOS.PHOTO_LIBRARY,
        }, {
            platform: 'android',
            permission: Permissions.PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        }];

        for (let i = 0; i < platformPermissions.length; i++) {
            const {platform, permission} = platformPermissions[i];
            Platform.OS = platform;

            const check = jest.spyOn(Permissions, 'check');
            const request = jest.spyOn(Permissions, 'request');
            request.mockReturnValue(Permissions.RESULTS.GRANTED);

            const wrapper = renderWithIntl(
                <ImageQuickAction {...baseProps}/>,
            );

            check.mockReturnValueOnce(Permissions.RESULTS.DENIED);
            fireEvent.press(wrapper.getByTestId(baseProps.testID));
            await expect(check).toHaveBeenCalledWith(permission); // eslint-disable-line no-await-in-loop
            await expect(request).toHaveBeenCalled(); // eslint-disable-line no-await-in-loop

            check.mockReturnValueOnce(Permissions.RESULTS.UNAVAILABLE);
            fireEvent.press(wrapper.getByTestId(baseProps.testID));
            await expect(check).toHaveBeenCalledWith(permission); // eslint-disable-line no-await-in-loop
            await expect(request).toHaveBeenCalled(); // eslint-disable-line no-await-in-loop
        }
    });

    test('should re-enable StatusBar after ImagePicker launchImageLibrary finishes', async () => {
        const wrapper = renderWithIntl(
            <ImageQuickAction {...baseProps}/>,
        );

        fireEvent.press(wrapper.getByTestId(baseProps.testID));
        const check = jest.spyOn(Permissions, 'check');
        jest.spyOn(PermissionUtils, 'hasPhotoPermission').mockReturnValue(true);
        const setHidden = jest.spyOn(StatusBar, 'setHidden');

        fireEvent.press(wrapper.getByTestId(baseProps.testID));
        await expect(check).toHaveBeenCalled();
        await expect(setHidden).toHaveBeenCalledWith(false);
    });
});
