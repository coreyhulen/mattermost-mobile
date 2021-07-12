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
import {SettingsSidebar} from '@support/ui/component';
import {ChannelScreen} from '@support/ui/screen';

describe('User Status', () => {
    const testMessage = Date.now().toString();
    let testUser;
    let testOtherUser;
    let testChannel;

    beforeAll(async () => {
        const {user, team} = await Setup.apiInit();
        testUser = user;

        ({user: testOtherUser} = await User.apiCreateUser());
        await Team.apiAddUserToTeam(testOtherUser.id, team.id);

        ({channel: testChannel} = await Channel.apiCreateDirectChannel([testUser.id, testOtherUser.id]));
        await User.apiLogin(testUser);
        await Post.apiCreatePost({
            channelId: testChannel.id,
            message: testMessage,
        });

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3251 should be able to set status', async () => {
        const {
            closeSettingsSidebar,
            getPostListPostItem,
            goToChannel,
            openSettingsSidebar,
        } = ChannelScreen;

        // # Set user status to away
        await openSettingsSidebar();
        await SettingsSidebar.setUserStatusTo('away');
        await closeSettingsSidebar();

        // # Login as other user
        await ChannelScreen.logout();
        await ChannelScreen.open(testOtherUser);

        // * Verify user's profile has status away as seen by other user
        await goToChannel(testUser.username);
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        const {postListPostItemProfilePictureUserStatus} = await getPostListPostItem(post.id, testMessage, {userId: testUser.id, userStatus: 'away'});
        await expect(postListPostItemProfilePictureUserStatus).toBeVisible();
    });
});
