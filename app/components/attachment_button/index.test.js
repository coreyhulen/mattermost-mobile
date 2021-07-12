// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Alert, StatusBar} from 'react-native';
import Permissions from 'react-native-permissions';

import Preferences from '@mm-redux/constants/preferences';
import {VALID_MIME_TYPES} from '@screens/edit_profile/edit_profile';
import {shallowWithIntl} from '@test/intl-test-helper';

import AttachmentButton from './index';

jest.mock('react-native-image-picker', () => ({
    launchCamera: jest.fn().mockImplementation((options, callback) => callback({didCancel: true})),
    launchImageLibrary: jest.fn().mockImplementation((options, callback) => callback({didCancel: true})),
}));

describe('AttachmentButton', () => {
    const baseProps = {
        theme: Preferences.THEMES.default,
        maxFileSize: 10,
        uploadFiles: jest.fn(),
    };

    test('should match snapshot', () => {
        const wrapper = shallowWithIntl(<AttachmentButton {...baseProps}/>);

        expect(wrapper.getElement()).toMatchSnapshot();
    });

    test('should not upload file with invalid MIME type', () => {
        const props = {
            ...baseProps,
            validMimeTypes: VALID_MIME_TYPES,
            onShowUnsupportedMimeTypeWarning: jest.fn(),
        };

        const wrapper = shallowWithIntl(<AttachmentButton {...props}/>);

        const file = {
            type: 'image/gif',
            fileSize: 10,
            fileName: 'test',
        };
        wrapper.instance().uploadFiles([file]);
        expect(props.onShowUnsupportedMimeTypeWarning).toHaveBeenCalled();
        expect(props.uploadFiles).not.toHaveBeenCalled();
    });

    test('should upload file with valid MIME type', () => {
        const props = {
            ...baseProps,
            validMimeTypes: VALID_MIME_TYPES,
            onShowUnsupportedMimeTypeWarning: jest.fn(),
        };

        const wrapper = shallowWithIntl(<AttachmentButton {...props}/>);

        const file = {
            fileSize: 10,
            fileName: 'test',
        };
        VALID_MIME_TYPES.forEach((mimeType) => {
            file.type = mimeType;
            wrapper.instance().uploadFiles([file]);
            expect(props.onShowUnsupportedMimeTypeWarning).not.toHaveBeenCalled();
            expect(props.uploadFiles).toHaveBeenCalled();
        });
    });

    test('should return permission false if permission is denied in iOS', async () => {
        jest.spyOn(Permissions, 'check').mockReturnValue(Permissions.RESULTS.DENIED);
        jest.spyOn(Permissions, 'request').mockReturnValue(Permissions.RESULTS.DENIED);

        const wrapper = shallowWithIntl(
            <AttachmentButton {...baseProps}/>,
        );

        const hasPhotoPermission = await wrapper.instance().hasPhotoPermission('camera');
        expect(Permissions.check).toHaveBeenCalled();
        expect(Permissions.request).toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
        expect(hasPhotoPermission).toBe(false);
    });

    test('should show permission denied alert and return permission false if permission is blocked in iOS', async () => {
        jest.spyOn(Permissions, 'check').mockReturnValue(Permissions.RESULTS.BLOCKED);
        jest.spyOn(Alert, 'alert').mockReturnValue(true);

        const wrapper = shallowWithIntl(
            <AttachmentButton {...baseProps}/>,
        );

        const hasPhotoPermission = await wrapper.instance().hasPhotoPermission('camera');
        expect(Permissions.check).toHaveBeenCalled();
        expect(Permissions.request).not.toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalled();
        expect(hasPhotoPermission).toBe(false);
    });

    test('should re-enable StatusBar after ImagePicker launchCamera finishes', async () => {
        const wrapper = shallowWithIntl(
            <AttachmentButton {...baseProps}/>,
        );

        const instance = wrapper.instance();
        jest.spyOn(instance, 'hasPhotoPermission').mockReturnValue(true);
        jest.spyOn(StatusBar, 'setHidden');

        await instance.attachFileFromCamera();
        expect(StatusBar.setHidden).toHaveBeenCalledWith(false);
    });

    test('should re-enable StatusBar after ImagePicker launchImageLibrary finishes', async () => {
        const wrapper = shallowWithIntl(
            <AttachmentButton {...baseProps}/>,
        );

        const instance = wrapper.instance();
        jest.spyOn(instance, 'hasPhotoPermission').mockReturnValue(true);
        jest.spyOn(StatusBar, 'setHidden');

        await instance.attachFileFromLibrary();
        expect(StatusBar.setHidden).toHaveBeenCalledWith(false);
    });
});
