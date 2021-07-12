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
import {MainSidebar} from '@support/ui/component';
import {
    ChannelInfoScreen,
    ChannelScreen,
    MoreDirectMessagesScreen,
    ThreadScreen,
    UserProfileScreen,
} from '@support/ui/screen';
import {getRandomId} from '@support/utils';

describe('Direct Messages', () => {
    const searchTerm = getRandomId();
    const {
        channelNavBarTitle,
        closeMainSidebar,
        getPostListPostItem,
        goToChannel,
        openMainSidebar,
        openReplyThreadFor,
    } = ChannelScreen;
    const {
        getUserAtIndex,
        searchInput,
        startButton,
    } = MoreDirectMessagesScreen;
    const {getChannelByDisplayName} = MainSidebar;
    let testUser;
    let testOtherUser;
    let townSquareChannel;
    let testMessage;

    beforeAll(async () => {
        const {user, team} = await Setup.apiInit();
        testUser = user;

        ({user: testOtherUser} = await User.apiCreateUser({prefix: searchTerm}));
        await Team.apiAddUserToTeam(testOtherUser.id, team.id);

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Post message by other user
        testMessage = `Message by ${testOtherUser.username}`;
        await User.apiLogin(testOtherUser);
        await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: testMessage,
        });

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3209 should be able to open direct message from main sidebar', async () => {
        // # Create a DM with the other user
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await searchInput.typeText(testOtherUser.username);
        await getUserAtIndex(0).tap();
        await startButton.tap();

        // * Verify DM channel is created
        await ChannelInfoScreen.open();
        await expect(ChannelInfoScreen.channelDisplayName).toHaveText(testOtherUser.username);
        await ChannelInfoScreen.close();
        await goToChannel(testOtherUser.username);

        // # Go back to channel
        await goToChannel(townSquareChannel.display_name);
    });

    it('MM-T3210 should be able to open direct message from profile info in channel', async () => {
        // # Open user profile screen from channel
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {postListPostItemProfilePicture} = await getPostListPostItem(post.id, testMessage, {userId: testOtherUser.id});
        await postListPostItemProfilePicture.tap();
        await UserProfileScreen.toBeVisible();

        // # Open direct message from profile and verify can post message
        await openDirectMessageFromProfileAndVerifyCanPostMessage(testOtherUser);

        // # Go back to channel
        await goToChannel(townSquareChannel.display_name);
    });

    it('MM-T3211 should be able to open direct message from profile info in reply thread', async () => {
        // # Open user profile screen from reply thread
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openReplyThreadFor(post.id, testMessage);
        const {postListPostItemProfilePicture} = await ThreadScreen.getPostListPostItem(post.id, testMessage, {userId: testOtherUser.id});
        await postListPostItemProfilePicture.tap();
        await UserProfileScreen.toBeVisible();

        // # Open direct message from profile and verify can post message
        await openDirectMessageFromProfileAndVerifyCanPostMessage(testOtherUser);

        // # Go back to channel
        await goToChannel(townSquareChannel.display_name);
    });

    it('MM-T3215 should be able to close direct message', async () => {
        // # Create a DM with the other user
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await searchInput.typeText(searchTerm);
        await getUserAtIndex(0).tap();
        await startButton.tap();

        // * Verify DM channel is created
        await ChannelInfoScreen.open();
        await expect(ChannelInfoScreen.channelDisplayName).toHaveText(testOtherUser.username);
        await ChannelInfoScreen.close();
        await goToChannel(testOtherUser.username);

        // # Close DM channel
        await ChannelInfoScreen.open();
        await ChannelInfoScreen.leaveAction.tap();

        // * Verify redirected to town square and does not appear in channel list
        await expect(channelNavBarTitle).toHaveText(townSquareChannel.display_name);
        await openMainSidebar();
        await expect(getChannelByDisplayName(testOtherUser.username)).not.toBeVisible();

        // # Close main sidebar
        await closeMainSidebar();
    });

    it('MM-T3216 should be able to open direct message with self', async () => {
        // # Open a DM with self
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();
        await searchInput.typeText(testUser.username);
        await getUserAtIndex(0).tap();

        // * Verify DM channel with self is displayed
        await expect(channelNavBarTitle).toHaveText(`${testUser.username} (you) `);
    });
});

async function openDirectMessageFromProfileAndVerifyCanPostMessage(testOtherUser) {
    const {
        sendMessageAction,
        userProfileScrollView,
    } = UserProfileScreen;

    // # Open direct message from profile
    await userProfileScrollView.scrollTo('bottom');
    await sendMessageAction.tap();

    // * Verify DM channel is created
    await ChannelInfoScreen.open();
    await expect(ChannelInfoScreen.channelDisplayName).toHaveText(testOtherUser.username);

    // * Verify direct message can be posted
    const directMessage = Date.now().toString();
    await ChannelInfoScreen.close();
    await ChannelScreen.postMessage(directMessage);
    await expect(element(by.text(directMessage))).toBeVisible();
}
