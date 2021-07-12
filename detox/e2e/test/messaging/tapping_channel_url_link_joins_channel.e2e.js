// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    Channel,
    Post,
    Setup,
    Team,
    User,
} from '@support/server_api';
import {
    serverUrl,
} from '@support/test_config';
import {
    Alert,
    MainSidebar,
    TeamsList,
} from '@support/ui/component';
import {
    ChannelScreen,
    CreateChannelScreen,
    PermalinkScreen,
} from '@support/ui/screen';
import {
    getAdminAccount,
    getRandomId,
    timeouts,
    wait,
} from '@support/utils';

describe('Messaging', () => {
    const {
        channelNavBarTitle,
        goToChannel,
        logout,
        openTeamSidebar,
        postMessage,
    } = ChannelScreen;
    let testChannel;
    let testTeam;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testChannel = channel;
        testTeam = team;

        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3471 Tapping channel URL link joins public channel', async () => {
        // # Go to the Town Square channel
        await goToChannel('Town Square');

        // # There's no way to get a channel permalink on mobile so we make one manually
        const channelPermalink = `${serverUrl}/${testTeam.name}/channels/${testChannel.name}`;

        // # Post the channel permalink to the test channel in Town Square
        await postMessage(channelPermalink);
        await expect(element(by.text(channelPermalink))).toBeVisible();

        // # Create another user in the same team, log in and go to town square
        const {user: otherUser} = await User.apiCreateUser({prefix: 'TestUser'});
        await Team.apiAddUserToTeam(otherUser.id, testTeam.id);
        await logout();
        await ChannelScreen.open(otherUser);
        await goToChannel('Town Square');

        // # As this new user, tap the channel permalink we posted earlier
        await tapLink(channelPermalink);

        // * Confirm that we have joined the correct channel from the channel permalink
        await expect(channelNavBarTitle).toHaveText(testChannel.display_name);
    });

    // - Create two private channels
    // - Post first channel url link in the public channel
    // - Post a message in second channel and post the permalink of it in the public channel
    // - Confirm the prompt and join the channel
    it('MM-30237 System admins prompted before joining private channel via permalink', async () => {
        const {getTeamByDisplayName} = MainSidebar;

        // # Create Private Channel 1
        const privateChannel1Name = 'pc' + getRandomId();
        await createPrivateChannel(privateChannel1Name);

        // # Create Private Channel 2
        const privateChannel2Name = 'pc' + getRandomId();
        await createPrivateChannel(privateChannel2Name);

        // # Post a message in private channel 2
        await postMessage(Date.now().toString());

        // # Get the last post data
        const {channel: privateChannel2} = await Channel.apiGetChannelByName(testTeam.id, privateChannel2Name);
        const {post} = await Post.apiGetLastPostInChannel(privateChannel2.id);

        // # Go to the Town Square channel
        await goToChannel('Town Square');

        // # Post Private Channel 1 Permalink
        const message1 = `${serverUrl}/${testTeam.name}/channels/${privateChannel1Name}`;
        await postMessage(message1, {quickReplace: true});

        // * Check that message is successfully posted
        await expect(element(by.text(message1))).toExist();

        // # Post Private Channel 2's POST Permalink
        const message2 = `${serverUrl}/${testTeam.name}/pl/${post.id}`;
        await postMessage(message2);

        // * Check that message is successfully posted
        await expect(element(by.text(message2))).toExist();

        // # Logout and login as sysadmin
        await logout();
        await ChannelScreen.open(getAdminAccount());

        // * Verify channel screen is visible
        await ChannelScreen.toBeVisible();

        // # Go to the team
        await openTeamSidebar();
        await waitFor(getTeamByDisplayName(testTeam.display_name)).toBeVisible().whileElement(by.id(TeamsList.testID.teamsList)).scroll(500, 'down');
        await getTeamByDisplayName(testTeam.display_name).tap();

        // # Press on message 1
        await tapLink(message1);

        // # Press on Join button
        await joinPrivateChannel();

        // * Confirm joining the "private channel 1"
        await expect(ChannelScreen.channelIntro).toHaveText('Beginning of ' + privateChannel1Name);

        // # Go to Townsquare
        await goToChannel('Town Square');

        // # Press on message 2
        await tapLink(message2);

        // # Press on Join button
        await joinPrivateChannel();

        // * Verify permalink post list has the message
        await PermalinkScreen.toBeVisible();
        await expect(element(by.text(post.message))).toBeVisible();

        // # Jump to recent messages
        await PermalinkScreen.jumpToRecentMessages();

        // * Verify user is on channel where message is posted
        await expect(ChannelScreen.channelIntro).toHaveText('Beginning of ' + privateChannel2Name);
    });
});

async function createPrivateChannel(channelName) {
    // # Open create private channel screen
    await ChannelScreen.openMainSidebar();
    await MainSidebar.openCreatePrivateChannelButton.tap();

    // * Verify create channel screen is visible
    await CreateChannelScreen.toBeVisible();
    await expect(element(by.text('New Private Channel'))).toBeVisible();

    // # Fill the data and create a private channel
    await CreateChannelScreen.nameInput.typeText(channelName);
    await CreateChannelScreen.createButton.tap();

    // * Expect a redirection to the created channel
    await expect(ChannelScreen.channelIntro).toHaveText('Beginning of ' + channelName);
}

async function joinPrivateChannel() {
    await expect(Alert.joinPrivateChannelTitle).toBeVisible();
    await Alert.joinButton.tap();
}

async function tapLink(message) {
    const permalinkPost = element(by.text(message));
    await permalinkPost.tap({x: 5, y: 10});
    await wait(timeouts.ONE_SEC);
}
