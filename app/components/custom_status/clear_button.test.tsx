// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import ClearButton, {ClearButtonProps} from '@components/custom_status/clear_button';
import Preferences from '@constants/preferences';
import {fireEvent, renderWithIntl, waitFor} from '@test/intl-test-helper';

describe('@components/custom_status/clear_button', () => {
    const baseProps: ClearButtonProps = {
        theme: Preferences.THEMES.default,
        handlePress: jest.fn(),
        testID: 'clear.button.touchable',
    };

    it('should match snapshot', () => {
        const wrapper = renderWithIntl(<ClearButton{...baseProps}/>);
        expect(wrapper.toJSON()).toMatchSnapshot();
    });

    it('should call handlePress when press event is fired', async () => {
        const {getByTestId} = renderWithIntl(<ClearButton{...baseProps}/>);
        const button = getByTestId('clear.button.touchable');
        await waitFor(() => fireEvent.press(button), {timeout: 300});

        expect(baseProps.handlePress).toBeCalled();
    });
});
