// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Setup,
    Team,
    User,
} from '@support/server_api';
import {
    ChannelScreen,
    ChannelInfoScreen,
    EditChannelScreen,
    MoreDirectMessagesScreen,
} from '@support/ui/screen';

describe('Edit Channel', () => {
    const {
        editChannelScreen,
        headerInput,
        nameInput,
        purposeInput,
        saveButton,
    } = EditChannelScreen;
    const {
        addMembersAction,
        archiveAction,
        channelDisplayName,
        channelInfoScrollView,
        channelPurpose,
        editChannelAction,
        favoritePreferenceAction,
        ignoreMentionsPreferenceAction,
        manageMembersAction,
        mutePreferenceAction,
        notificationPreferenceAction,
        leaveAction,
        pinnedMessagesAction,
    } = ChannelInfoScreen;
    const {
        getUserAtIndex,
        searchInput,
        startButton,
    } = MoreDirectMessagesScreen;
    const {
        goToChannel,
        openMainSidebar,
    } = ChannelScreen;
    let testUser;
    let testOtherUser1;
    let testOtherUser2;
    let testChannel;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testUser = user;
        testChannel = channel;

        ({user: testOtherUser1} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testOtherUser1.id, team.id);

        ({user: testOtherUser2} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testOtherUser2.id, team.id);

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3190 should be able to display channel info', async () => {
        // # Open channel info screen
        await goToChannel(testChannel.display_name);
        await ChannelInfoScreen.open();

        // * Verify channel info fields are visible
        await expect(channelDisplayName).toHaveText(testChannel.display_name);
        await expect(channelPurpose).toHaveText(`Channel purpose: ${testChannel.display_name.toLowerCase()}`);
        await expect(element(by.text(`Channel header: ${testChannel.display_name.toLowerCase()}`))).toBeVisible();
        await expect(favoritePreferenceAction).toBeVisible();
        await expect(mutePreferenceAction).toBeVisible();
        await expect(ignoreMentionsPreferenceAction).toBeVisible();
        await expect(notificationPreferenceAction).toBeVisible();
        await expect(pinnedMessagesAction).toBeVisible();
        await expect(manageMembersAction).toBeVisible();
        await channelInfoScrollView.scrollTo('bottom');
        await expect(addMembersAction).toBeVisible();
        await expect(editChannelAction).toBeVisible();
        await expect(leaveAction).toBeVisible();
        await expect(archiveAction).toBeVisible();

        // # Close channel info screen
        await ChannelInfoScreen.close();
    });

    it('MM-T3199 should be able to edit public channel', async () => {
        // # Open edit channel screen
        await goToChannel(testChannel.display_name);
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();

        // # Edit channel info
        await nameInput.typeText(' name');
        await purposeInput.typeText(' purpose');
        await editChannelScreen.scrollTo('bottom');
        await headerInput.tapReturnKey();
        await headerInput.typeText('header1');
        await headerInput.tapReturnKey();
        await headerInput.typeText('header2');

        // # Save changes
        await saveButton.tap();

        // * Verify changes have been saved
        await channelInfoScrollView.scrollTo('top');
        await expect(channelDisplayName).toHaveText(`${testChannel.display_name} name`);
        await expect(channelPurpose).toHaveText(`Channel purpose: ${testChannel.display_name.toLowerCase()} purpose`);
        await expect(element(by.text(`Channel header: ${testChannel.display_name.toLowerCase()}\nheader1\nheader2`))).toBeVisible();

        // # Close channel info screen
        await ChannelInfoScreen.close();
    });

    it('MM-T3212 should be able edit direct message channel', async () => {
        // # Create a DM with the other user
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await searchInput.typeText(testOtherUser1.username);
        await getUserAtIndex(0).tap();
        await startButton.tap();

        // # Open edit channel screen
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();

        // # Edit channel info
        await headerInput.typeText('header1');
        await headerInput.tapReturnKey();
        await headerInput.typeText('header2');

        // # Save changes
        await saveButton.tap();

        // * Verify changes have been saved
        await channelInfoScrollView.scrollTo('top');
        await expect(element(by.text('header1\nheader2'))).toBeVisible();

        // # Close channel info screen
        await ChannelInfoScreen.close();
    });

    it('MM-T3214 should be able edit group message channel', async () => {
        // # Create a DM with the other user
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await searchInput.typeText(testOtherUser1.username);
        await getUserAtIndex(0).tap();
        await searchInput.typeText(testOtherUser2.username);
        await getUserAtIndex(0).tap();
        await startButton.tap();

        // # Open edit channel screen
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();

        // # Edit channel info
        await headerInput.typeText('header1');
        await headerInput.tapReturnKey();
        await headerInput.typeText('header2');

        // # Save changes
        await saveButton.tap();

        // * Verify changes have been saved
        await channelInfoScrollView.scrollTo('top');
        await expect(element(by.text('header1\nheader2'))).toBeVisible();

        // # Close channel info screen
        await ChannelInfoScreen.close();
    });
});
