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
import {
    ChannelScreen,
    TableScreen,
} from '@support/ui/screen';
import {isIos} from '@support/utils';

describe('Markdown Table', () => {
    const {channelPostList} = ChannelScreen;
    const {tableScrollView} = TableScreen;
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

    it('MM-T190 should display markdown table', async () => {
        // # Post a markdown table
        const markdownTable =
            '| A | B | C |\n' +
            '|:---|:---|:---|\n' +
            '| 1 | Name | Toast |\n' +
            '| 2 | Name | Server |\n';
        await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: markdownTable,
        });

        // * Verify markdown table is displayed
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {postListPostItemTable} = await ChannelScreen.getPostListPostItem(post.id);
        await expect(postListPostItemTable).toBeVisible();
    });

    it('MM-T1441 should wrap long text and is visible on screen', async () => {
        // # Post a markdown table
        const markdownTable =
            '| Left header that wraps | Center header that wraps | Right header that wraps |\n' +
            '| :-- | :-: | --: |\n' +
            '| Left text that wraps row | Center text that wraps row | Right text that wraps row |\n';
        await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: markdownTable,
        });

        // * Verify long text wraps properly and is visible
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {
            postListPostItemTable,
            postListPostItemTableExpandButton,
        } = await ChannelScreen.getPostListPostItem(post.id);
        await expect(postListPostItemTable).toBeVisible();
        await expect(element(by.text('Left header that wraps'))).toBeVisible();
        await expect(element(by.text('Center header that wraps'))).toBeVisible();
        await expect(element(by.text('Right header that wraps'))).toBeVisible();
        await expect(element(by.text('Left text that wraps row'))).toBeVisible();
        await expect(element(by.text('Center text that wraps row'))).toBeVisible();
        await expect(element(by.text('Right text that wraps row'))).toBeVisible();

        // # Expand to full view
        if (isIos()) {
            await channelPostList.scrollTo('bottom');
        }
        await postListPostItemTableExpandButton.tap();
        await TableScreen.toBeVisible();
        await expect(element(by.text('Left header that wraps'))).toBeVisible();
        await expect(element(by.text('Center header that wraps'))).toBeVisible();
        await expect(element(by.text('Right header that wraps'))).toBeVisible();
        await expect(element(by.text('Left text that wraps row'))).toBeVisible();
        await expect(element(by.text('Center text that wraps row'))).toBeVisible();
        await expect(element(by.text('Right text that wraps row'))).toBeVisible();

        // # Go back to channel
        await TableScreen.back();
    });

    it('MM-T1443 should allow horizontal scroll in full view', async () => {
        // # Post a markdown table
        const markdownTable =
            '| Header | Header | Header | Header | Header | Header | Header | Header HS last |\n' +
            '| :-- | :-: | --: | --: | :-- | :-: | --: | --: |\n' +
            '| Left | Center | Right | Right | Left | Center | Right | Right |\n'.repeat(7) +
            '| Left | Center | Right | Right | Left | Center | Right | Right HS last |\n';
        await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: markdownTable,
        });

        // * Verify long text wraps properly and is visible
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {
            postListPostItemTable,
            postListPostItemTableExpandButton,
        } = await ChannelScreen.getPostListPostItem(post.id);
        await expect(postListPostItemTable).toBeVisible();
        await expect(element(by.text('Header HS last'))).not.toBeVisible();
        await expect(element(by.text('Right HS last'))).not.toBeVisible();

        // # Expand to full view
        if (isIos()) {
            await channelPostList.scrollTo('bottom');
        }
        await postListPostItemTableExpandButton.tap();
        await TableScreen.toBeVisible();
        await expect(element(by.text('Header HS last'))).not.toBeVisible();
        await expect(element(by.text('Right HS last'))).not.toBeVisible();

        // * Verify scrollable to the right
        await tableScrollView.scrollTo('right');
        await expect(element(by.text('Header HS last'))).toBeVisible();
        await expect(element(by.text('Right HS last'))).toBeVisible();

        // # Go back to channel
        await TableScreen.back();
    });

    it('MM-T1444 should allow vertical scroll in full view', async () => {
        // # Post a markdown table
        const markdownTable =
            '| Header | Header | Header VS last |\n' +
            '| :-- | :-: | --: |\n' +
            '| Left | Center | Right |\n'.repeat(30) +
            '| Left | Center | Right VS last |\n';
        await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: markdownTable,
        });

        // * Verify long text wraps properly and is visible
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {
            postListPostItemTable,
            postListPostItemTableExpandButton,
        } = await ChannelScreen.getPostListPostItem(post.id);
        await expect(postListPostItemTable).toBeVisible();
        await expect(element(by.text('Header VS last'))).toBeVisible();
        await expect(element(by.text('Right VS last'))).not.toBeVisible();

        // # Expand to full view
        if (isIos()) {
            await channelPostList.scrollTo('bottom');
        }
        await postListPostItemTableExpandButton.tap();
        await TableScreen.toBeVisible();
        await expect(element(by.text('Header VS last'))).toBeVisible();
        await expect(element(by.text('Right VS last'))).not.toBeVisible();

        // * Verify scrollable to the bottom
        if (isIos()) {
            await tableScrollView.scrollTo('bottom');
        } else {
            await waitFor(element(by.text('Right VS last'))).toBeVisible().whileElement(by.id(TableScreen.testID.tableScreen)).scroll(1000, 'down');
        }
        await expect(element(by.text('Header VS last'))).not.toBeVisible();
        await expect(element(by.text('Right VS last'))).toBeVisible();

        // # Go back to channel
        await TableScreen.back();
    });

    it('MM-T1445 should allow both horizontal and vertical scrolls in full view', async () => {
        // # Post a markdown table
        const markdownTable =
            '| Header | Header | Header | Header | Header | Header | Header | Header last |\n' +
            '| :-- | :-: | --: | --: | :-- | :-: | --: | --: |\n' +
            '| Left | Center | Right | Right | Left | Center | Right | Right |\n'.repeat(30) +
            '| Left | Center | Right | Right | Left | Center | Right | Right last |\n';
        await Post.apiCreatePost({
            channelId: townSquareChannel.id,
            message: markdownTable,
        });

        // * Verify long text wraps properly and is visible
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        const {
            postListPostItemTable,
            postListPostItemTableExpandButton,
        } = await ChannelScreen.getPostListPostItem(post.id);
        await expect(postListPostItemTable).toBeVisible();
        await expect(element(by.text('Header last'))).not.toBeVisible();
        await expect(element(by.text('Right last'))).not.toBeVisible();

        // # Expand to full view
        if (isIos()) {
            await channelPostList.scrollTo('bottom');
        }
        await postListPostItemTableExpandButton.tap();
        await TableScreen.toBeVisible();
        await expect(element(by.text('Header last'))).not.toBeVisible();
        await expect(element(by.text('Right last'))).not.toBeVisible();

        // * Verify scrollable to the right
        await tableScrollView.scrollTo('right');
        await expect(element(by.text('Header last'))).toBeVisible();
        await expect(element(by.text('Right last'))).not.toBeVisible();

        // * Verify scrollable to the bottom
        if (isIos()) {
            await tableScrollView.scrollTo('bottom');
        } else {
            await waitFor(element(by.text('Right last'))).toBeVisible().whileElement(by.id(TableScreen.testID.tableScreen)).scroll(1000, 'down');
        }
        await expect(element(by.text('Header last'))).not.toBeVisible();
        await expect(element(by.text('Right last'))).toBeVisible();

        // # Go back to channel
        await TableScreen.back();
    });
});
