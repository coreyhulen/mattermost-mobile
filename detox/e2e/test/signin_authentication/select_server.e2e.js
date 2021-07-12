// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {serverUrl} from '@support/test_config';
import {
    LoginScreen,
    SelectServerScreen,
} from '@support/ui/screen';
import {timeouts} from '@support/utils';

describe('Select Server', () => {
    const {
        connectButton,
        errorText,
        serverUrlInput,
    } = SelectServerScreen;

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('should show Select server screen on initial load', async () => {
        // * Verify basic elements on Select Server screen
        await SelectServerScreen.toBeVisible();

        await expect(serverUrlInput).toBeVisible();
        await expect(connectButton).toBeVisible();
    });

    it('MM-T3383 should show error on empty server URL', async () => {
        const screen = await SelectServerScreen.toBeVisible();

        // # Enter an empty server URL
        await serverUrlInput.typeText(' ');

        // # Tap anywhere to hide keyboard
        await screen.tap({x: 5, y: 10});

        // * Verify that the error message does not exist
        await waitFor(errorText).not.toExist().withTimeout(timeouts.HALF_SEC);

        // # Tap connect button
        await connectButton.tap();

        // * Verify error message
        await waitFor(errorText).toBeVisible().withTimeout(timeouts.ONE_SEC);
        await expect(errorText).toHaveText('Please enter a valid server URL');
    });

    it('should show error on invalid server URL', async () => {
        const screen = await SelectServerScreen.toBeVisible();

        // # Enter invalid server URL
        await serverUrlInput.clearText();
        await serverUrlInput.typeText(serverUrl.substring(0, serverUrl.length - 1));

        // # Tap anywhere to hide keyboard
        await screen.tap({x: 5, y: 10});

        // * Verify that the error message does not exist
        await waitFor(errorText).not.toExist().withTimeout(timeouts.HALF_SEC);

        // # Tap connect button
        await connectButton.tap();

        // * Verify error message
        await waitFor(errorText).toBeVisible().withTimeout(timeouts.ONE_SEC);
        await expect(errorText).toHaveText('Cannot connect to the server. Please check your server URL and internet connection.');
    });

    it('should move to Login screen on valid server URL', async () => {
        await SelectServerScreen.toBeVisible();

        // # Enter valid server URL
        await serverUrlInput.replaceText(serverUrl);

        // # Tap connect button
        await connectButton.tap();

        // * Verify that it goes into Login screen
        await LoginScreen.toBeVisible();
    });
});
