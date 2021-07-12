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
import {Autocomplete} from '@support/ui/component';
import {
    ChannelScreen,
    EditPostScreen,
} from '@support/ui/screen';

describe('Autocomplete', () => {
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

    it('MM-T3391 should render autocomplete in post edit screen', async () => {
        const {
            openPostOptionsFor,
            postMessage,
        } = ChannelScreen;

        // # Post a message
        const testMessage = Date.now().toString();
        await postMessage(testMessage);

        // # Open edit post screen
        const {post} = await Post.apiGetLastPostInChannel(testChannel.id);
        await openPostOptionsFor(post.id, testMessage);
        await EditPostScreen.open();

        const {atMentionSuggestionList} = Autocomplete;
        const {
            closeEditPostButton,
            messageInput,
        } = EditPostScreen;

        // # Open autocomplete
        await expect(atMentionSuggestionList).not.toExist();
        await messageInput.typeText(' @');

        // * Expect at_mention autocomplete to render
        await expect(atMentionSuggestionList).toExist();

        // # Close edit post screen
        await closeEditPostButton.tap();
    });
});
