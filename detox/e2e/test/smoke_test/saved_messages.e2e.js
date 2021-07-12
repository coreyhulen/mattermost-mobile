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
} from '@support/server_api';
import {PostOptions} from '@support/ui/component';
import {
    ChannelScreen,
    SavedMessagesScreen,
    ThreadScreen,
} from '@support/ui/screen';

describe('Saved Messages', () => {
    const {
        getPostListPostItem,
        openPostOptionsFor,
        openReplyThreadFor,
        openSettingsSidebar,
        postMessage,
    } = ChannelScreen;
    const {
        reactionPickerAction,
        saveAction,
        unsaveAction,
    } = PostOptions;
    const message = Date.now().toString();
    let testChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();

        const {channel} = await Channel.apiGetChannelByName(team.id, 'town-square');
        testChannel = channel;

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3219 should be able save a message from channel post list', async () => {
        // # Post a message
        await postMessage(message);

        // # Save message from channel post list
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await openPostOptionsFor(post.id, message);
        await saveAction.tap();

        // * Verify message appears in saved messages
        const {postListPostItemPreHeaderText} = await getPostListPostItem(post.id, message);
        await expect(postListPostItemPreHeaderText).toHaveText('Saved');
        await openSettingsSidebar();
        await SavedMessagesScreen.open();
        const {searchResultPostItem} = await SavedMessagesScreen.getSearchResultPostItem(post.id, message);
        await expect(searchResultPostItem).toBeVisible();

        // # Close saved messages screen
        await SavedMessagesScreen.close();
    });

    it('MM-T3221 should be able unsave from reply thread', async () => {
        // # Unsave message from reply thread
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await openReplyThreadFor(post.id, message);
        await ThreadScreen.openPostOptionsFor(post.id, message);
        await unsaveAction.tap();

        // * Verify message does not appear in saved messages
        const {postListPostItemPreHeaderText} = await getPostListPostItem(post.id, message);
        await expect(postListPostItemPreHeaderText).not.toBeVisible();
        await ThreadScreen.back();
        await openSettingsSidebar();
        await SavedMessagesScreen.open();
        await expect(element(by.text('No Saved messages yet'))).toBeVisible();

        // # Close saved messages screen
        await SavedMessagesScreen.close();
    });

    it('MM-T3220 should not be able to add a reaction on saved messages', async () => {
        // # Save message from channel post list
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await openPostOptionsFor(post.id, message);
        await saveAction.tap();

        // * Verify add a reaction is not available in post options
        await openSettingsSidebar();
        await SavedMessagesScreen.open();
        await SavedMessagesScreen.openPostOptionsFor(post.id, message);
        await expect(reactionPickerAction).not.toBeVisible();
        await PostOptions.close();

        // # Close saved messages screen
        await SavedMessagesScreen.close();
    });
});
