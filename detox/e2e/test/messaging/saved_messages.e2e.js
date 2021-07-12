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
    System,
} from '@support/server_api';
import {PostOptions} from '@support/ui/component';
import {
    ChannelScreen,
    SavedMessagesScreen,
} from '@support/ui/screen';

describe('Saved Messages', () => {
    const {
        getPostListPostItem,
        goToChannel,
        openPostOptionsFor,
        openSettingsSidebar,
        postMessage,
    } = ChannelScreen;
    const {
        saveAction,
        unsaveAction,
    } = PostOptions;
    let testChannel;
    let townSquareChannel;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testChannel = channel;

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    beforeEach(async () => {
        await System.apiUpdateConfig({TeamSettings: {ExperimentalTownSquareIsReadOnly: false}});
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T143 should be able save and unsave a message from a read-only channel', async () => {
        // # Post a message
        const testMessage = Date.now().toString();
        await postMessage(testMessage);

        // # Set town square to read-only
        await System.apiUpdateConfig({TeamSettings: {ExperimentalTownSquareIsReadOnly: true}});
        await goToChannel(testChannel.display_name);
        await goToChannel(townSquareChannel.display_name);

        // # Save message from read-only channel
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openPostOptionsFor(post.id, testMessage);
        await saveAction.tap();

        // * Verify message appears in saved messages
        const {postListPostItemPreHeaderText: savedPostPreHeaderText} = await getPostListPostItem(post.id, testMessage);
        await expect(savedPostPreHeaderText).toHaveText('Saved');
        await openSettingsSidebar();
        await SavedMessagesScreen.open();
        const {searchResultPostItem} = await SavedMessagesScreen.getSearchResultPostItem(post.id, testMessage);
        await expect(searchResultPostItem).toBeVisible();

        // # Unsave message from read-only channel
        await SavedMessagesScreen.close();
        await openPostOptionsFor(post.id, testMessage);
        await unsaveAction.tap();

        // * Verify message does not appear in saved messages
        const {postListPostItemPreHeaderText: unsavedPostPreHeaderText} = await getPostListPostItem(post.id, testMessage);
        await expect(unsavedPostPreHeaderText).not.toBeVisible();
        await openSettingsSidebar();
        await SavedMessagesScreen.open();
        await expect(element(by.text('No Saved messages yet'))).toBeVisible();

        // # Close saved messages screen
        await SavedMessagesScreen.close();
    });
});
