// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Channel,
    Setup,
} from '@support/server_api';
import {BottomSheet} from '@support/ui/component';
import {
    ChannelInfoScreen,
    ChannelScreen,
    EditChannelScreen,
    MoreDirectMessagesScreen,
} from '@support/ui/screen';
import {isIos, timeouts, wait} from '@support/utils';

describe('Channel Info', () => {
    const {
        goToChannel,
        postInput,
    } = ChannelScreen;
    const {
        headerInput,
        nameInput,
        purposeInput,
        saveButton,
    } = EditChannelScreen;
    let testChannel1;
    let testChannel2;
    let townSquareChannel;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testChannel1 = channel;

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));
        ({channel: testChannel2} = await Channel.apiCreateChannel({type: 'O', teamId: team.id}));
        await Channel.apiAddUserToChannel(user.id, testChannel2.id);

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T849 should be able to display channel info', async () => {
        // # Open channel info screen
        await ChannelInfoScreen.open();

        // * Verify channel info is displayed
        await expect(ChannelInfoScreen.channelDisplayName).toHaveText(townSquareChannel.display_name);

        // # Go back to channel
        await ChannelInfoScreen.close();
    });

    it('MM-T866 whitespaces on channel name should be trimmed on alert popups', async () => {
        const {
            archiveChannel,
            leaveChannel,
        } = ChannelInfoScreen;

        // # Add whitespaces to channel name
        await ChannelScreen.goToChannel(testChannel1.display_name);
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();
        await nameInput.replaceText(` ${testChannel1.display_name} `);
        await saveButton.tap();

        // * Verify channel name is trimmed on alert popups
        await leaveChannel({confirm: false, description: `Are you sure you want to leave the public channel ${testChannel1.display_name}?`});
        await archiveChannel({confirm: false, description: `Are you sure you want to archive the public channel ${testChannel1.display_name}?`});

        // # Go back to channel
        await ChannelInfoScreen.close();
    });

    it('MM-T867 should be able to copy channel header text', async () => {
        // # Edit channel header
        await goToChannel(townSquareChannel.display_name);
        const expectedHeader = `Channel header: ${townSquareChannel.display_name.toLowerCase()}`;
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();
        await headerInput.replaceText(expectedHeader);
        await saveButton.tap();

        // # Copy channel header text
        await element(by.text(expectedHeader)).longPress();
        await BottomSheet.copyHeaderOption.tap();

        // # Go back to channel
        await ChannelInfoScreen.close();

        // Tapping on Paste currently works on iOS only
        if (isIos()) {
            // # Paste to channel post draft
            await postInput.longPress();
            await element(by.text('Paste')).tap();

            // * Verify header text is pasted to channel post draft
            await expect(postInput).toHaveText(expectedHeader);
            await postInput.clearText();
        }
    });

    it('MM-T868 should be able to copy channel purpose text', async () => {
        // # Edit channel purpose
        await goToChannel(townSquareChannel.display_name);
        const expectedPurpose = `Channel purpose: ${townSquareChannel.display_name.toLowerCase()}`;
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();
        await purposeInput.replaceText(expectedPurpose);
        await saveButton.tap();

        // # Copy channel purpose text
        await element(by.text(expectedPurpose)).longPress();
        await BottomSheet.copyPurposeOption.tap();

        // # Go back to channel
        await ChannelInfoScreen.close();

        // Tapping on Paste currently works on iOS only
        if (isIos()) {
            // # Paste to channel post draft
            await postInput.longPress();
            await element(by.text('Paste')).tap();

            // * Verify purpose text is pasted to channel post draft
            await expect(postInput).toHaveText(expectedPurpose);
            await postInput.clearText();
        }
    });

    it('MM-T869 should be able to copy url from channel header', async () => {
        // # Edit channel header
        const expectedHeaderUrl = 'https://mattermost.com';
        await goToChannel(townSquareChannel.display_name);
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();
        await headerInput.replaceText(expectedHeaderUrl);
        await saveButton.tap();

        // # Copy channel url
        await element(by.text(expectedHeaderUrl)).longPress();
        await BottomSheet.copyUrlOption.tap();

        // # Go back to channel
        await ChannelInfoScreen.close();

        // Tapping on Paste currently works on iOS only
        if (isIos()) {
            // # Paste to channel post draft
            await postInput.longPress();
            await element(by.text('Paste')).tap();

            // * Verify url is pasted to channel post draft
            await expect(postInput).toHaveText(expectedHeaderUrl);
            await postInput.clearText();
        }
    });

    it('MM-T1733 should not render markdown in channel purpose', async () => {
        // # Edit channel purpose
        const expectedPurpose = '[Mattermost](https://mattermost.com)';
        await goToChannel(townSquareChannel.display_name);
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();
        await purposeInput.replaceText(expectedPurpose);
        await saveButton.tap();

        // * Verify purpose is literal text
        await expect(element(by.text(expectedPurpose))).toBeVisible();

        // # Go back to channel
        await ChannelInfoScreen.close();
    });

    it('MM-T2980 should be able to save channel name up to 64 characters only', async () => {
        // # Open edit channel screen
        const channelName64Char = 'ChannelName12345678901234567890123456789012345678901234567890123';
        await ChannelScreen.goToChannel(testChannel2.display_name);
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();

        // # Attempt to edit channel name with more than 64 characters
        await nameInput.replaceText(channelName64Char + 'x');
        if (isIos()) {
            // # Attempt to save
            await saveButton.tap();

            // * Verify error message is displayed
            await expect(element(by.text('Channel name must be less than 64 characters'))).toBeVisible();
        } else {
            // * Verify extra characters are trimmed on Android
            await expect(nameInput).toHaveText(channelName64Char);
        }

        // # Edit channel name with exactly 64 characters
        await nameInput.replaceText(channelName64Char);
        await saveButton.tap();

        // * Verify channel name is saved
        await expect(ChannelInfoScreen.channelDisplayName).toHaveText(channelName64Char);

        // # Go back to channel
        await ChannelInfoScreen.close();
    });

    it('MM-T3406 should render correct GM member count in channel info header', async () => {
        const {
            getUserAtIndex,
            startButton,
        } = MoreDirectMessagesScreen;

        // # Open more direct messages screen
        await ChannelScreen.goToChannel(townSquareChannel.display_name);
        await ChannelScreen.openMainSidebar();
        await MoreDirectMessagesScreen.open();

        // # Wait for some profiles to load
        await wait(timeouts.ONE_SEC);

        // # Select 3 profiles
        await getUserAtIndex(0).tap();
        await getUserAtIndex(1).tap();
        await getUserAtIndex(2).tap();

        // # Create a GM with selected profiles
        await startButton.tap();

        // # Open channel info screen
        await ChannelInfoScreen.open();

        // * Verify GM member count is 3
        await expect(ChannelInfoScreen.channelIconGMMemberCount).toHaveText('3');

        // # Close channel info screen
        await ChannelInfoScreen.close();
    });
});
