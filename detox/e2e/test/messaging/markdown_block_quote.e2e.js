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
import {ChannelScreen} from '@support/ui/screen';

describe('Markdown Block Quote', () => {
    let townSquareChannel;

    beforeAll(async () => {
        const {team, user} = await Setup.apiInit();

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T195 should display markdown block quote', async () => {
        // # Post a markdown block quote
        const markdownBlockQuote = 'this is a quote that i am making long so it wraps on mobile this is a quote that i am making long so it wraps on mobile this is a quote that i am making long so it wraps on mobile this is a quote that i am making long so it wraps on mobile';
        await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: `>${markdownBlockQuote}`,
        });

        // * Verify markdown block quote is displayed
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {postListPostItemBlockQuote} = await ChannelScreen.getPostListPostItem(post.id);
        await expect(postListPostItemBlockQuote).toBeVisible();
        await expect(element(by.text(markdownBlockQuote))).toBeVisible();
    });
});
