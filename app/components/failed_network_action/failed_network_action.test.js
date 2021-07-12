// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {waitFor} from '@testing-library/react-native';

import React from 'react';

import Preferences from '@mm-redux/constants/preferences';
import {renderWithReduxIntl} from '@test/testing_library';

import FailedNetworkAction from './failed_network_action';

describe('FailedNetworkAction', () => {
    const baseProps = {
        onRetry: jest.fn(),
        theme: Preferences.THEMES.default,
        isLandscape: false,
        errorMessage: 'Error Message',
        errorTitle: 'Error Title',
    };

    test('Cloud in portrait', async () => {
        const {getByTestId} = renderWithReduxIntl(
            <FailedNetworkAction {...baseProps}/>,
        );

        await waitFor(() => expect(getByTestId('failed_network_action.cloud_icon')).toBeTruthy());
    });

    test('Cloud NOT in landscape', async () => {
        const props = {...baseProps, isLandscape: true};
        const {queryByTestId} = renderWithReduxIntl(
            <FailedNetworkAction {...props}/>,
        );

        await waitFor(() => expect(queryByTestId('failed_network_action.cloud_icon')).toBeNull());
    });
});
