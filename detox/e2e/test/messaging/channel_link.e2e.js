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
import testConfig from '@support/test_config';
import {ChannelScreen} from '@support/ui/screen';
import {timeouts, wait} from '@support/utils';

describe('Channel Link', () => {
    const {
        channelNavBarTitle,
        goToChannel,
        openReplyThreadFor,
        postMessage,
    } = ChannelScreen;
    let testChannel;
    let testTeam;
    let townSquareChannel;

    beforeAll(async () => {
        const {user, team, channel} = await Setup.apiInit();
        testChannel = channel;
        testTeam = team;

        ({channel: townSquareChannel} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T2970 should be able to open channel by tapping on channel link from main channel', async () => {
        // # Post a channel link
        await goToChannel(townSquareChannel.display_name);
        const channelLink = `${testConfig.siteUrl}/${testTeam.name}/channels/${testChannel.name}`;
        await postMessage(channelLink);

        // # Tap on the channel link
        await element(by.text(channelLink)).tap({x: 5, y: 10});
        await wait(timeouts.ONE_SEC);

        // * Verify redirected to test channel
        await expect(channelNavBarTitle).toHaveText(testChannel.display_name);
    });

    xit('MM-T178 should be able to open channel by tapping on channel link from reply thread', async () => { // related issue https://mattermost.atlassian.net/browse/MM-36532
        // # Post a channel link
        await goToChannel(townSquareChannel.display_name);
        const channelLink = `${testConfig.siteUrl}/${testTeam.name}/channels/${testChannel.name}`;
        await postMessage(channelLink);

        // # Tap on the channel link from reply thread
        const {post} = await Post.apiGetLastPostInChannel(townSquareChannel.id);
        await openReplyThreadFor(post.id, channelLink);
        await element(by.text(channelLink)).tap({x: 5, y: 10});
        await wait(timeouts.ONE_SEC);

        // * Verify redirected to test channel
        await expect(channelNavBarTitle).toHaveText(testChannel.display_name);
    });
});
