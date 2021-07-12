// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import {fireEvent, waitFor} from '@testing-library/react-native';

import React from 'react';

import {renderWithReduxIntl} from '@test/testing_library';

import SelectServer from './select_server.js';

describe('SelectServer', () => {
    const actions = {
        getPing: jest.fn(),
        handleServerUrlChanged: jest.fn(),
        scheduleExpiredNotification: jest.fn(),
        loadConfigAndLicense: jest.fn(),
        login: jest.fn(),
        resetPing: jest.fn(),
        setServerVersion: jest.fn(),
    };

    const baseProps = {
        actions,
        hasConfigAndLicense: true,
        serverUrl: '',
    };

    test('should match error when URL is empty string', async () => {
        const {getByTestId, getByText} = renderWithReduxIntl(
            <SelectServer {...baseProps}/>,
        );

        const button = getByText('Connect');
        fireEvent.press(button);

        await waitFor(() => expect(getByTestId('select_server.error.text')).toBeTruthy());
        expect(getByText('Please enter a valid server URL')).toBeTruthy();
    });

    test('should match error when URL is only spaces', async () => {
        const {getByTestId, getByText} = renderWithReduxIntl(
            <SelectServer {...baseProps}/>,
        );

        const urlInput = getByTestId('select_server.server_url.input');
        fireEvent.changeText(urlInput, '  ');

        const button = getByText('Connect');
        fireEvent.press(button);

        await waitFor(() => expect(getByTestId('select_server.error.text')).toBeTruthy());
        expect(getByText('Please enter a valid server URL')).toBeTruthy();
    });

    test('should match error when URL does not start with http:// or https://', async () => {
        const {getByTestId, getByText} = renderWithReduxIntl(
            <SelectServer {...baseProps}/>,
        );

        const urlInput = getByTestId('select_server.server_url.input');
        fireEvent.changeText(urlInput, 'ht://invalid:8065');

        const button = getByText('Connect');
        fireEvent.press(button);

        await waitFor(() => expect(getByTestId('select_server.error.text')).toBeTruthy());
        expect(getByText('URL must start with http:// or https://')).toBeTruthy();
    });

    test('should not show error when valid URL is entered', async () => {
        const {getByTestId, getByText, queryByTestId} = renderWithReduxIntl(
            <SelectServer {...baseProps}/>,
        );

        const urlInput = getByTestId('select_server.server_url.input');
        fireEvent.changeText(urlInput, 'http://localhost:8065');

        const button = getByText('Connect');
        fireEvent.press(button);

        expect(queryByTestId('select_server.error.text')).toBeNull();
        await waitFor(() => expect(getByText('Connecting...')).toBeTruthy());
    });
});
