// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {fireEvent} from '@testing-library/react-native';

import React from 'react';
import {Alert, Platform} from 'react-native';
import Permissions from 'react-native-permissions';

import Preferences from '@mm-redux/constants/preferences';
import {renderWithIntl} from '@test/testing_library';

import FileQuickAction from './index';

describe('FileQuickAction', () => {
    const baseProps = {
        disabled: false,
        testID: 'post_draft.quick_actions.file_action',
        fileCount: 0,
        maxFileCount: 5,
        theme: Preferences.THEMES.default,
        onUploadFiles: jest.fn(),
    };

    beforeAll(() => {
        Platform.OS = 'android';
    });

    afterAll(() => {
        Platform.OS = 'ios';
    });

    test('should match snapshot', () => {
        const wrapper = renderWithIntl(<FileQuickAction {...baseProps}/>);

        expect(wrapper.toJSON()).toMatchSnapshot();
    });

    test('should return permission false if permission is denied in Android', async () => {
        jest.spyOn(Permissions, 'check').mockReturnValue(Permissions.RESULTS.UNAVAILABLE);
        jest.spyOn(Permissions, 'request').mockReturnValue(Permissions.RESULTS.DENIED);

        const wrapper = renderWithIntl(
            <FileQuickAction {...baseProps}/>,
        );

        fireEvent.press(wrapper.getByTestId(baseProps.testID));
        await expect(Permissions.check).toHaveBeenCalled();
        await expect(Permissions.request).toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    test('should show permission denied alert and return permission false if permission is blocked in Android', async () => {
        jest.spyOn(Permissions, 'check').mockReturnValue(Permissions.RESULTS.BLOCKED);
        jest.spyOn(Permissions, 'request');
        jest.spyOn(Alert, 'alert').mockReturnValue(true);

        const wrapper = renderWithIntl(
            <FileQuickAction {...baseProps}/>,
        );

        fireEvent.press(wrapper.getByTestId(baseProps.testID));
        await expect(Permissions.check).toHaveBeenCalled();
        expect(Permissions.request).not.toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalled();
    });

    test('hasStoragePermission returns true when permission has been granted', async () => {
        const wrapper = renderWithIntl(
            <FileQuickAction {...baseProps}/>,
        );

        const check = jest.spyOn(Permissions, 'check');
        const request = jest.spyOn(Permissions, 'request');

        // On iOS storage permissions are not checked
        Platform.OS = 'ios';
        fireEvent.press(wrapper.getByTestId(baseProps.testID));
        expect(check).not.toHaveBeenCalled();
        expect(request).not.toHaveBeenCalled();

        Platform.OS = 'android';
        request.mockReturnValue(Permissions.RESULTS.GRANTED);
        const permission = Permissions.PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

        check.mockReturnValueOnce(Permissions.RESULTS.DENIED);
        fireEvent.press(wrapper.getByTestId(baseProps.testID));
        await expect(check).toHaveBeenCalledWith(permission);
        await expect(request).toHaveBeenCalled();

        check.mockReturnValueOnce(Permissions.RESULTS.UNAVAILABLE);
        fireEvent.press(wrapper.getByTestId(baseProps.testID));
        await expect(check).toHaveBeenCalledWith(permission);
        await expect(request).toHaveBeenCalled();
    });
});
