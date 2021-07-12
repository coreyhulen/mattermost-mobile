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

describe('Markdown Separator', () => {
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

    it('MM-T191 should display markdown separator', async () => {
        // # Post a markdown separator
        const markdownSeparator = '---';
        await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: markdownSeparator,
        });

        // * Verify markdown separator is displayed
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {postListPostItemThematicBreak} = await ChannelScreen.getPostListPostItem(post.id);
        await expect(postListPostItemThematicBreak).toBeVisible();
    });
});
