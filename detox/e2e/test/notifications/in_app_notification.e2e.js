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
    AddReactionScreen,
    ChannelScreen,
    NotificationScreen,
} from '@support/ui/screen';
import {
    isAndroid,
    timeouts,
    wait,
} from '@support/utils';

const DetoxConstants = require('detox').DetoxConstants;

describe('in-app Notification', () => {
    let testChannel1;
    let testChannel2;
    let testNotification;

    beforeAll(async () => {
        const {channel, team, user} = await Setup.apiInit();
        testChannel1 = channel;
        testNotification = getNotification(testChannel1, team, user);

        ({channel: testChannel2} = await Channel.apiGetChannelByName(team.id, 'town-square'));

        // # Open channel screen
        await ChannelScreen.open(user);
    });

    afterAll(async () => {
        await ChannelScreen.logout();
    });

    it('MM-T3440 should render an in-app notification', async () => {
        const {
            postMessage,
            openPostOptionsFor,
        } = ChannelScreen;

        // # Post a message
        const testMessage = Date.now().toString();
        await postMessage(testMessage);

        // # Open add reaction screen
        const {post} = await Post.apiGetLastPostInChannel(testChannel2.id);
        await openPostOptionsFor(post.id, testMessage);
        await AddReactionScreen.open();

        // # Close add reaction screen
        await AddReactionScreen.close();

        if (isAndroid()) {
            // eslint-disable-next-line no-console
            console.log('Skipping on Android until https://github.com/wix/Detox/issues/2141');
            return;
        }

        // # When a push notification is received
        await device.sendUserNotification(testNotification);
        await wait(timeouts.HALF_SEC);

        // * Verify in-app notification is shown
        const {
            inAppNotificationScreen,
            inAppNotificationIcon,
            inAppNotificationTitle,
            inAppNotificationMessage,
        } = NotificationScreen;

        await NotificationScreen.toBeVisible();
        await expect(inAppNotificationIcon).toBeVisible();
        await expect(inAppNotificationTitle).toHaveText(testChannel1.name);
        await expect(inAppNotificationMessage).toHaveText('This is an e2e test message');

        // # Wait for some profiles to load
        await wait(5 * timeouts.ONE_SEC);

        // * Verify in-app notification is hidden
        await expect(inAppNotificationScreen).not.toBeVisible();
    });
});

function getNotification(channel, team, user) {
    if (isAndroid()) {
        return {
            payload: {
                ack_id: 'ack-e2e-test-id',
                type: 'message',
                badge: 1,
                version: '2',
                channel_id: channel.id,
                channel_name: channel.name,
                team_id: team.id,
                sender_id: user.id,
                sender_name: user.name,
                message: 'This is an e2e test message',
                post_id: 'post-e2e-test-id',
                root_id: '',
            },
        };
    }
    return {
        trigger: {
            type: DetoxConstants.userNotificationTriggers.push,
        },
        badge: 1,
        body: 'This is an e2e test message',
        payload: {
            ack_id: 'ack-e2e-test-id',
            type: 'message',
            version: '2',
            channel_id: channel.id,
            channel_name: channel.name,
            team_id: team.id,
            sender_id: user.id,
            sender_name: user.name,
            post_id: 'post-e2e-test-id',
            root_id: '',
        },
    };
}
