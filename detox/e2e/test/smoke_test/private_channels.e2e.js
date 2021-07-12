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
    Team,
    User,
} from '@support/server_api';
import {MainSidebar} from '@support/ui/component';
import {
    ChannelAddMembersScreen,
    ChannelInfoScreen,
    ChannelMembersScreen,
    ChannelScreen,
    CreateChannelScreen,
    EditChannelScreen,
} from '@support/ui/screen';
import {getRandomId} from '@support/utils';

describe('Private Channels', () => {
    const testOtherUserSearchTerm = 'a-other';
    const {
        channelNavBarTitle,
        closeMainSidebar,
        goToChannel,
        openMainSidebar,
        postMessage,
    } = ChannelScreen;
    const {
        addMembersAction,
        channelDisplayName,
        channelInfoScrollView,
        channelPurpose,
        leaveChannel,
        manageMembersAction,
    } = ChannelInfoScreen;
    let testOtherUser;
    let testPrivateChannel;
    let townSquareChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();

        ({user: testOtherUser} = await User.apiCreateUser({prefix: `${testOtherUserSearchTerm}-`}));
        await Team.apiAddUserToTeam(testOtherUser.id, team.id);

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));
        ({channel: testPrivateChannel} = await Channel.apiCreateChannel({type: 'P', prefix: '1-private-channel', teamId: team.id}));
        await Channel.apiAddUserToChannel(user.id, testPrivateChannel.id);

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3203 should be able to create a private channel', async () => {
        const {
            createButton,
            nameInput,
        } = CreateChannelScreen;
        const {openCreatePrivateChannelButton} = MainSidebar;

        // # Create a private channel
        const privateChannelName = `Channel-${getRandomId()}`;
        await openMainSidebar();
        await openCreatePrivateChannelButton.tap();
        await CreateChannelScreen.toBeVisible();
        await expect(element(by.text('New Private Channel'))).toBeVisible();
        await nameInput.typeText(privateChannelName);
        await createButton.tap();

        // * Expect a redirection to the created channel
        await expect(ChannelScreen.channelIntro).toHaveText('Beginning of ' + privateChannelName);
    });

    it('MM-T3204 should be able to add user to private channel', async () => {
        const {
            addButton,
            getUserByDisplayUsername,
            searchInput,
        } = ChannelAddMembersScreen;

        // # Add user to private channel
        await goToChannel(testPrivateChannel.display_name);
        await postMessage('divider');
        await ChannelInfoScreen.open();
        await expect(element(by.id(ChannelInfoScreen.testID.manageMembersAction).withDescendant(by.text('2')))).toBeVisible();
        await channelInfoScrollView.scrollTo('bottom');
        await addMembersAction.tap();
        await searchInput.typeText(testOtherUserSearchTerm);
        await getUserByDisplayUsername(`@${testOtherUser.username}`).tap();
        await addButton.tap();

        // * Verify user is added to private
        await expect(element(by.id(ChannelInfoScreen.testID.manageMembersAction).withDescendant(by.text('3')))).toBeVisible();
        await ChannelInfoScreen.close();
        await expect(element(by.text(`@${testOtherUser.username} added to the channel by you.`))).toBeVisible();
    });

    it('MM-T3205 should be able to remove user from private channel', async () => {
        const {
            removeMembers,
            searchInput,
        } = ChannelMembersScreen;

        // # Remove user from private channel
        await goToChannel(testPrivateChannel.display_name);
        await ChannelInfoScreen.open();
        await expect(element(by.id(ChannelInfoScreen.testID.manageMembersAction).withDescendant(by.text('3')))).toBeVisible();
        await manageMembersAction.tap();
        await searchInput.typeText(testOtherUserSearchTerm);
        await removeMembers([testOtherUser.username]);

        // * Verify user is removed from private channel
        await expect(element(by.id(ChannelInfoScreen.testID.manageMembersAction).withDescendant(by.text('2')))).toBeVisible();
        await manageMembersAction.tap();
        await searchInput.typeText(testOtherUserSearchTerm);
        await expect(element(by.text('No Results'))).toBeVisible();
        await ChannelMembersScreen.back();

        // # Close channel info screen
        await ChannelInfoScreen.close();
    });

    it('MM-T3206 should be able to edit private channel', async () => {
        const {
            editChannelScreen,
            headerInput,
            nameInput,
            purposeInput,
            saveButton,
        } = EditChannelScreen;

        // # Edit private channel
        await goToChannel(testPrivateChannel.display_name);
        await ChannelInfoScreen.open();
        await EditChannelScreen.open();
        await nameInput.typeText(' name');
        await purposeInput.typeText(' purpose');
        await editChannelScreen.scrollTo('bottom');
        await headerInput.tapReturnKey();
        await headerInput.typeText('header1');
        await headerInput.tapReturnKey();
        await headerInput.typeText('header2');
        await saveButton.tap();

        // * Verify private channel is updated
        await channelInfoScrollView.scrollTo('top');
        await expect(channelDisplayName).toHaveText(`${testPrivateChannel.display_name} name`);
        await expect(channelPurpose).toHaveText(`Channel purpose: ${testPrivateChannel.display_name.toLowerCase()} purpose`);
        await expect(element(by.text(`Channel header: ${testPrivateChannel.display_name.toLowerCase()}\nheader1\nheader2`))).toBeVisible();

        // # Close channel info screen
        await ChannelInfoScreen.close();
    });

    it('MM-T3207 should be able to leave private channel', async () => {
        // # Attempt to leave private channel twice, tap No first, then tap Yes second
        await ChannelInfoScreen.open();
        await leaveChannel({confirm: false, publicChannel: false});
        await leaveChannel({confirm: true, publicChannel: false});

        // * Verify redirected to town square and does not appear in channel list
        await expect(channelNavBarTitle).toHaveText(townSquareChannel.display_name);
        await openMainSidebar();
        await expect(MainSidebar.getChannelByDisplayName(testPrivateChannel.display_name)).not.toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });
});
