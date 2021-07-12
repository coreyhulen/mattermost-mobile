// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {Setup} from '@support/server_api';
import {Alert} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('Message Draft', () => {
    const {
        postInput,
        sendButton,
        sendButtonDisabled,
    } = ChannelScreen;

    beforeAll(async () => {
        const {user} = await Setup.apiInit();

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T107 should show warning message when message exceeds character limit', async () => {
        // # Type message that exceeds character limit (16384)
        let message = '1234567890'.repeat(1638) + '1234';
        await postInput.replaceText(message);

        // * Verify warning message is displayed and send button is disabled
        await expect(Alert.messageLengthTitle).toBeVisible();
        await expect(element(by.text('Your current message is too long. Current character count: 16384/16383'))).toBeVisible();
        await Alert.okButton.tap();
        await expect(sendButtonDisabled).toBeVisible();

        // # Type message that wit max character limit (16383)
        message = '1234567890'.repeat(1638) + '123';
        await postInput.replaceText(message);

        // * Verify warning message is not displayed and send button is enabled
        await expect(Alert.messageLengthTitle).not.toBeVisible();
        await expect(element(by.text('Your current message is too long. Current character count: 16383/16383'))).not.toBeVisible();
        await expect(sendButton).toBeVisible();

        // # Clear input
        await postInput.clearText();
    });

    it('MM-T128 should save message draft when app is closed the re-opened', async () => {
        // # Type a message draft
        const message = Date.now().toString();
        await postInput.typeText(message);

        // * Verify message draft
        await expect(postInput).toHaveText(message);

        // # Send app to home and re-open
        await device.sendToHome();
        await device.launchApp({newInstance: false});

        // * Verify message draft still exists
        await expect(postInput).toHaveText(message);

        // # Clear input
        await postInput.clearText();
    });
});
