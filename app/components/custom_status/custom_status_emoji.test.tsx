// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';

import {SYSTEM_IDENTIFIERS} from '@constants/database';
import DatabaseManager from '@database/manager';
import ServerDataOperator from '@database/operator/server_data_operator';
import NetworkManager from '@init/network_manager';
import {MOCKED_DATA} from '@test/mock_database_data';
import {renderWithDatabase} from '@test/intl-test-helper';

import CustomStatusEmoji from './custom_status_emoji';

import type {Database} from '@nozbe/watermelondb';

describe('@components/custom_status/custom_status_emoji', () => {
    let database: Database;
    let operator: ServerDataOperator;

    beforeAll(async () => {
        const serverUrl = 'baseHandler.test.com';
        await DatabaseManager.init([serverUrl]);
        database = DatabaseManager.serverDatabases[serverUrl].database;
        operator = DatabaseManager.serverDatabases[serverUrl].operator;

        await NetworkManager.init([{serverUrl, userId: '1234567', token: '432424788^^83434'}]);

        const users = operator.handleUsers({
            users: [
                {
                    id: 'p9g6rzz3kffhxqxhm1zckjpwda',
                    create_at: 1599457495881,
                    update_at: 1607683720173,
                    delete_at: 0,
                    username: 'a.l',
                    auth_service: 'saml',
                    email: 'a.l@mattermost.com',
                    email_verified: true,
                    is_bot: false,
                    nickname: '',
                    first_name: 'A',
                    last_name: 'L',
                    position: 'Mobile Engineer',
                    roles: 'system_user',
                    props: {},
                    notify_props: {
                        mark_unread: 'all',
                        desktop: 'all',
                        desktop_sound: 'true',
                        email: 'true',
                        first_name: 'true',
                        mention_keys: '',
                        push: 'mention',
                        channel: 'true',
                        auto_responder_active: 'false',
                        auto_responder_message:
                            'Hello, I am out of office and unable to respond to messages.',
                        comments: 'never',
                        desktop_notification_sound: 'Hello',
                        push_status: 'online',
                    },
                    last_picture_update: 1604686302260,
                    locale: 'en',
                    timezone: {
                        automaticTimezone: 'Indian/Mauritius',
                        manualTimezone: '',
                        useAutomaticTimezone: '',
                    },
                },
                {
                    id: '1234567',
                    create_at: 1599457495881,
                    update_at: 1607683720173,
                    delete_at: 0,
                    username: 'a.l',
                    auth_service: 'saml',
                    email: 'a.l@mattermost.com',
                    email_verified: true,
                    is_bot: false,
                    nickname: '',
                    first_name: 'A',
                    last_name: 'L',
                    position: 'Mobile Engineer',
                    roles: 'system_user',
                    props: {
                        customStatus: {
                            emoji: 'calendar',
                            text: 'In a meeting',
                        },
                    },
                    notify_props: {
                        desktop: 'all',
                        mark_unread: 'all',
                        desktop_sound: 'true',
                        email: 'true',
                        first_name: 'true',
                        mention_keys: '',
                        push: 'mention',
                        channel: 'true',
                        auto_responder_active: 'false',
                        auto_responder_message:
                            'Hello, I am out of office and unable to respond to messages.',
                        comments: 'never',
                        desktop_notification_sound: 'Hello',
                        push_status: 'online',
                    },
                    last_picture_update: 1604686302260,
                    locale: 'en',
                    timezone: {
                        automaticTimezone: 'Indian/Mauritius',
                        manualTimezone: '',
                        useAutomaticTimezone: '',
                    },
                }],
            prepareRecordsOnly: true,
        });

        const systems = operator.handleSystem({
            systems: [
                {id: 'currentUserId', value: 'p9g6rzz3kffhxqxhm1zckjpwda'},
                {id: SYSTEM_IDENTIFIERS.CONFIG, value: MOCKED_DATA.CONFIG},
            ],
            prepareRecordsOnly: true,
        });

        const emojis = operator.handleCustomEmojis({
            emojis: [
                {
                    id: 'i',
                    create_at: 1580913641769,
                    update_at: 1580913641769,
                    delete_at: 0,
                    creator_id: '4cprpki7ri81mbx8efixcsb8jo',
                    name: 'calendar',
                },
            ],
            prepareRecordsOnly: true,
        });

        const models = await Promise.all([emojis, systems, users]);

        const flattenedModels = models.flat();
        if (flattenedModels?.length > 0) {
            await operator.batchRecords(flattenedModels);
        }
    });

    it('should match snapshot', () => {
        const wrapper = renderWithDatabase(<CustomStatusEmoji/>, database);
        expect(wrapper.toJSON()).toMatchSnapshot();
    });

    it('should return undefined for currentUserId as no custom status is set', () => {
        const wrapper = renderWithDatabase(<CustomStatusEmoji/>, database);
        expect(wrapper.toJSON()).toBeNull();
    });

    it('should return a value for userId 1234567 as a custom status is set', () => {
        const wrapper = renderWithDatabase(<CustomStatusEmoji userId={'1234567'}/>, database);
        expect(wrapper.toJSON()).toBeDefined();
    });
});
