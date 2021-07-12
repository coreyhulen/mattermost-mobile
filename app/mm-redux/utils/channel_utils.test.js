// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import TestHelper from 'test/test_helper';

import {
    areChannelMentionsIgnored,
    canManageMembersOldPermissions,
    compareNotifyProps,
    isAutoClosed,
    isChannelMuted,
    filterChannelsMatchingTerm,
    sortChannelsByRecency,
    sortChannelsByDisplayName,
} from '@mm-redux/utils/channel_utils';

import {General, Users} from '../constants';

describe('ChannelUtils', () => {
    it('canManageMembersOldPermissions', () => {
        const notLicensed = {IsLicensed: 'false'};
        const licensed = {IsLicensed: 'true'};

        const anyoneCanManageMembers = {RestrictPrivateChannelManageMembers: General.PERMISSIONS_ANY};
        const channelAdminsCanManageMembers = {RestrictPrivateChannelManageMembers: General.PERMISSIONS_CHANNEL_ADMIN};
        const teamAdminsCanManageMembers = {RestrictPrivateChannelManageMembers: General.PERMISSIONS_TEAM_ADMIN};
        const systemAdminsCanManageMembers = {RestrictPrivateChannelManageMembers: General.PERMISSIONS_SYSTEM_ADMIN};

        const townSquareChannel = {name: General.DEFAULT_CHANNEL, type: General.OPEN_CHANNEL};
        const publicChannel = {type: General.PUBLIC_CHANNEL};
        const privateChannel = {type: General.PRIVATE_CHANNEL};
        const gmChannel = {type: General.GM_CHANNEL};
        const dmChannel = {type: General.DM_CHANNEL};

        const systemAdmin = {roles: General.SYSTEM_USER_ROLE + ' ' + General.SYSTEM_ADMIN_ROLE};
        const systemUser = {roles: General.SYSTEM_USER_ROLE};

        const teamAdmin = {roles: General.TEAM_USER_ROLE + ' ' + General.TEAM_ADMIN_ROLE};
        const teamUser = {roles: General.TEAM_USER_ROLE};

        const channelAdmin = {roles: General.CHANNEL_USER_ROLE + ' ' + General.CHANNEL_ADMIN_ROLE};
        const channelUser = {roles: General.CHANNEL_USER_ROLE};

        // No one can manage users of town square
        assert.ok(!canManageMembersOldPermissions(townSquareChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, notLicensed));
        assert.ok(!canManageMembersOldPermissions(townSquareChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));

        // Or DM/GM channels
        assert.ok(!canManageMembersOldPermissions(dmChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, notLicensed));
        assert.ok(!canManageMembersOldPermissions(dmChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(!canManageMembersOldPermissions(gmChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, notLicensed));
        assert.ok(!canManageMembersOldPermissions(gmChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));

        // Everyone can manage users of public channels
        assert.ok(canManageMembersOldPermissions(publicChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, notLicensed));
        assert.ok(canManageMembersOldPermissions(publicChannel, systemUser, teamUser, channelUser, anyoneCanManageMembers, notLicensed));
        assert.ok(canManageMembersOldPermissions(publicChannel, systemAdmin, teamAdmin, channelAdmin, systemAdminsCanManageMembers, notLicensed));
        assert.ok(canManageMembersOldPermissions(publicChannel, systemUser, teamUser, channelUser, systemAdminsCanManageMembers, notLicensed));
        assert.ok(canManageMembersOldPermissions(publicChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(publicChannel, systemUser, teamUser, channelUser, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(publicChannel, systemAdmin, teamAdmin, channelAdmin, systemAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(publicChannel, systemUser, teamUser, channelUser, systemAdminsCanManageMembers, licensed));

        // And private channels if not licensed
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, notLicensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamUser, channelUser, anyoneCanManageMembers, notLicensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamAdmin, channelAdmin, systemAdminsCanManageMembers, notLicensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamUser, channelUser, systemAdminsCanManageMembers, notLicensed));

        // But it gets complicated when you have a license
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamAdmin, channelAdmin, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamAdmin, channelAdmin, teamAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamAdmin, channelAdmin, systemAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamAdmin, channelUser, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamAdmin, channelUser, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamAdmin, channelUser, teamAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamAdmin, channelUser, systemAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamUser, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamUser, channelAdmin, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamUser, channelAdmin, teamAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamUser, channelAdmin, systemAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamUser, channelUser, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamUser, channelUser, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamUser, channelUser, teamAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemAdmin, teamUser, channelUser, systemAdminsCanManageMembers, licensed));

        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamAdmin, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamAdmin, channelAdmin, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamAdmin, channelAdmin, teamAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembersOldPermissions(privateChannel, systemUser, teamAdmin, channelAdmin, systemAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamAdmin, channelUser, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamAdmin, channelUser, channelAdminsCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamAdmin, channelUser, teamAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembersOldPermissions(privateChannel, systemUser, teamAdmin, channelUser, systemAdminsCanManageMembers, licensed));

        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamUser, channelAdmin, anyoneCanManageMembers, licensed));
        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamUser, channelAdmin, channelAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembersOldPermissions(privateChannel, systemUser, teamUser, channelAdmin, teamAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembersOldPermissions(privateChannel, systemUser, teamUser, channelAdmin, systemAdminsCanManageMembers, licensed));

        assert.ok(canManageMembersOldPermissions(privateChannel, systemUser, teamUser, channelUser, anyoneCanManageMembers, licensed));
        assert.ok(!canManageMembersOldPermissions(privateChannel, systemUser, teamUser, channelUser, channelAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembersOldPermissions(privateChannel, systemUser, teamUser, channelUser, teamAdminsCanManageMembers, licensed));
        assert.ok(!canManageMembersOldPermissions(privateChannel, systemUser, teamUser, channelUser, systemAdminsCanManageMembers, licensed));
    });

    it('isAutoClosed', () => {
        const autoCloseEnabled = {CloseUnusedDirectMessages: 'true'};
        const autoCloseDisabled = {CloseUnusedDirectMessages: 'false'};
        const activeChannel = {id: 'channelid', last_post_at: new Date().getTime()};
        const inactiveChannel = {id: 'channelid', last_post_at: 1};
        const now = new Date().getTime();

        assert.ok(isAutoClosed(autoCloseEnabled, {}, inactiveChannel));

        assert.ok(isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
        }, inactiveChannel));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
        }, inactiveChannel, now));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
        }, activeChannel));

        assert.ok(!isAutoClosed(autoCloseDisabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
        }, inactiveChannel));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
            'channel_open_time--channelid': {value: now.toString()},
        }, inactiveChannel));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'never'},
        }, inactiveChannel));

        assert.ok(isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
            'channel_open_time--channelid': {value: (now - 1000).toString()},
        }, inactiveChannel, 0, now));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
            'channel_open_time--channelid': {value: now.toString()},
        }, inactiveChannel, 0, now - 1000));

        assert.ok(!isAutoClosed(autoCloseEnabled, {
            'sidebar_settings--close_unused_direct_messages': {value: 'after_seven_days'},
            'channel_open_time--channelid': {value: (now - 1000).toString()},
        }, inactiveChannel, 0, now, 'channelid'));
    });

    it('areChannelMentionsIgnored', () => {
        const currentUserNotifyProps1 = {channel: 'true'};
        const channelMemberNotifyProps1 = {ignore_channel_mentions: Users.IGNORE_CHANNEL_MENTIONS_DEFAULT};
        assert.equal(false, areChannelMentionsIgnored(channelMemberNotifyProps1, currentUserNotifyProps1));

        const currentUserNotifyProps2 = {channel: 'true'};
        const channelMemberNotifyProps2 = {ignore_channel_mentions: Users.IGNORE_CHANNEL_MENTIONS_OFF};
        assert.equal(false, areChannelMentionsIgnored(channelMemberNotifyProps2, currentUserNotifyProps2));

        const currentUserNotifyProps3 = {channel: 'true'};
        const channelMemberNotifyProps3 = {ignore_channel_mentions: Users.IGNORE_CHANNEL_MENTIONS_ON};
        assert.equal(true, areChannelMentionsIgnored(channelMemberNotifyProps3, currentUserNotifyProps3));

        const currentUserNotifyProps4 = {channel: 'false'};
        const channelMemberNotifyProps4 = {ignore_channel_mentions: Users.IGNORE_CHANNEL_MENTIONS_DEFAULT};
        assert.equal(true, areChannelMentionsIgnored(channelMemberNotifyProps4, currentUserNotifyProps4));

        const currentUserNotifyProps5 = {channel: 'false'};
        const channelMemberNotifyProps5 = {ignore_channel_mentions: Users.IGNORE_CHANNEL_MENTIONS_OFF};
        assert.equal(false, areChannelMentionsIgnored(channelMemberNotifyProps5, currentUserNotifyProps5));

        const currentUserNotifyProps6 = {channel: 'false'};
        const channelMemberNotifyProps6 = {ignore_channel_mentions: Users.IGNORE_CHANNEL_MENTIONS_ON};
        assert.equal(true, areChannelMentionsIgnored(channelMemberNotifyProps6, currentUserNotifyProps6));

        const currentUserNotifyProps7 = {channel: true};
        const channelMemberNotifyProps7 = null;
        assert.equal(false, areChannelMentionsIgnored(channelMemberNotifyProps7, currentUserNotifyProps7));

        const currentUserNotifyProps8 = {channel: false};
        const channelMemberNotifyProps8 = null;
        assert.equal(false, areChannelMentionsIgnored(channelMemberNotifyProps8, currentUserNotifyProps8));
    });

    it('filterChannelsMatchingTerm', () => {
        const channel1 = TestHelper.fakeChannel();
        channel1.display_name = 'channel1';
        channel1.name = 'blargh1';
        const channel2 = TestHelper.fakeChannel();
        channel2.display_name = 'channel2';
        channel2.name = 'blargh2';
        const channels = [channel1, channel2];

        assert.deepEqual(filterChannelsMatchingTerm(channels, 'chan'), channels);
        assert.deepEqual(filterChannelsMatchingTerm(channels, 'CHAN'), channels);
        assert.deepEqual(filterChannelsMatchingTerm(channels, 'blargh'), channels);
        assert.deepEqual(filterChannelsMatchingTerm(channels, 'channel1'), [channel1]);
        assert.deepEqual(filterChannelsMatchingTerm(channels, 'junk'), []);
        assert.deepEqual(filterChannelsMatchingTerm(channels, 'annel'), []);
    });

    it('sortChannelsByRecency', () => {
        const channelA = TestHelper.fakeChannel();
        channelA.id = 'channel_a';
        channelA.last_post_at = 1;

        const channelB = TestHelper.fakeChannel();
        channelB.last_post_at = 2;
        channelB.id = 'channel_b';

        // sorting depends on channel's last_post_at when both channels don't have last post
        assert.deepEqual(sortChannelsByRecency({}, channelA, channelB), 1);

        // sorting depends on create_at of channel's last post if it's greater than the channel's last_post_at
        const lastPosts = {
            channel_a: {id: 'post_id_1', create_at: 5, update_at: 5},
            channel_b: {id: 'post_id_2', create_at: 7, update_at: 7},
        };
        assert.deepEqual(sortChannelsByRecency(lastPosts, channelA, channelB), 2, 'should return 2, comparison of create_at (7 - 5)');

        // sorting remains the same even if channel's last post is updated (e.g. edited, updated reaction, etc)
        lastPosts.channel_a.update_at = 10;
        assert.deepEqual(sortChannelsByRecency(lastPosts, channelA, channelB), 2, 'should return 2, comparison of create_at (7 - 5)');

        // sorting depends on create_at of channel's last post if it's greater than the channel's last_post_at
        lastPosts.channel_a.create_at = 10;
        assert.deepEqual(sortChannelsByRecency(lastPosts, channelA, channelB), -3, 'should return 2, comparison of create_at (7 - 10)');
    });

    it('sortChannelsByDisplayName', () => {
        const channelA = {
            name: 'channelA',
            team_id: 'teamId',
            display_name: 'Unit Test channelA',
            type: 'O',
            delete_at: 0,
            total_msg_count: 0,
        };

        const channelB = {
            name: 'channelB',
            team_id: 'teamId',
            display_name: 'Unit Test channelB',
            type: 'O',
            delete_at: 0,
            total_msg_count: 0,
        };

        assert.equal(sortChannelsByDisplayName('en', channelA, channelB), -1);
        assert.equal(sortChannelsByDisplayName('en', channelB, channelA), 1);

        // When a channel does not have a display name set
        Reflect.deleteProperty(channelB, 'display_name');
        assert.equal(sortChannelsByDisplayName('en', channelA, channelB), -1);
        assert.equal(sortChannelsByDisplayName('en', channelB, channelA), 1);
    });

    it('isChannelMuted', () => {
        const mutedChannelMember = {
            notify_props: {mark_unread: 'mention'},
        };

        const unmutedChannelMember = {
            notify_props: {mark_unread: 'all'},
        };

        assert.equal(true, isChannelMuted(mutedChannelMember));
        assert.equal(false, isChannelMuted(unmutedChannelMember));
    });

    it('compareNotifyProps', () => {
        const baseProps = {
            desktop: 'default',
            email: 'all',
            mark_unread: 'mention',
            push: 'default',
            ignore_channel_mentions: 'on',
        };

        assert.equal(true, compareNotifyProps(baseProps, {...baseProps}));
        assert.equal(false, compareNotifyProps(baseProps, {...baseProps, desktop: 'all'}));
        assert.equal(false, compareNotifyProps(baseProps, {...baseProps, email: 'mention'}));
        assert.equal(false, compareNotifyProps(baseProps, {...baseProps, push: 'none'}));
        assert.equal(false, compareNotifyProps(baseProps, {...baseProps, ignore_channel_mentions: 'off'}));
    });
});
