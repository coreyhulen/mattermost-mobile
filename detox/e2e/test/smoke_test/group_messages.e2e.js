// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// *******************************************************************
// - [#] indicates a test step (e.g. # Go to a screen)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element testID when selecting an element. Create one if none.
// *******************************************************************

import {
    User,
    Setup,
    Team,
} from '@support/server_api';
import {
    ChannelInfoScreen,
    ChannelScreen,
    MoreDirectMessagesScreen,
} from '@support/ui/screen';
import {getRandomId} from '@support/utils';

describe('Group Messages', () => {
    const searchTerm = getRandomId();
    let testUser;
    let testOtherUser1;
    let testOtherUser2;

    beforeAll(async () => {
        const {user, team} = await Setup.apiInit({userOptions: {prefix: `${searchTerm}-3-`}});
        testUser = user;

        ({user: testOtherUser1} = await User.apiCreateUser({prefix: `${searchTerm}-1-`}));
        await Team.apiAddUserToTeam(testOtherUser1.id, team.id);

        ({user: testOtherUser2} = await User.apiCreateUser({prefix: `${searchTerm}-2-`}));
        await Team.apiAddUserToTeam(testOtherUser2.id, team.id);

        // # Open channel screen
        await ChannelScreen.open(testUser);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3213 should be able to create a GM channel and post a message to the group', async () => {
        const {
            openMainSidebar,
            postMessage,
        } = ChannelScreen;
        const {
            getUserByDisplayUsername,
            hasUserDisplayUsernameAtIndex,
            getUserAtIndex,
            searchInput,
            startButton,
        } = MoreDirectMessagesScreen;

        // # Open more direct messages screen
        await openMainSidebar();
        await MoreDirectMessagesScreen.open();

        // * Verify all 3 users are listed
        await searchInput.typeText(searchTerm);
        await hasUserDisplayUsernameAtIndex(0, `@${testOtherUser1.username}`);
        await hasUserDisplayUsernameAtIndex(1, `@${testOtherUser2.username}`);
        await hasUserDisplayUsernameAtIndex(2, `@${testUser.username} - you`);

        // # Select profiles of other 2 users
        await getUserAtIndex(0).tap();
        await searchInput.typeText(searchTerm);
        await getUserAtIndex(1).tap();

        // * Verify current user is not displayed in the list
        await expect(getUserByDisplayUsername(`@${testUser.username} - you`)).not.toBeVisible();

        // # Create a GM with selected profiles
        await startButton.tap();

        // * Verify GM channel is created
        await ChannelInfoScreen.open();
        await expect(ChannelInfoScreen.channelDisplayName).toHaveText(`${testOtherUser1.username}, ${testOtherUser2.username}`);
        await ChannelInfoScreen.close();

        // * Verify current user can post message to GM channel
        const message = Date.now().toString();
        await postMessage(message);
        await expect(element(by.text(message))).toBeVisible();
    });
});
