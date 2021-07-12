// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Client4} from '@client/rest';
import {cleanUrlForLogging} from '@utils/sentry';

/* eslint-disable max-nested-callbacks */

describe('utils/sentry', () => {
    describe('cleanUrlForLogging', () => {
        Client4.setUrl('https://mattermost.example.com/subpath');

        const tests = [{
            name: 'should remove server URL',
            input: Client4.getUserRoute('me'),
            expected: `${Client4.urlVersion}/users/me`,
        }, {
            name: 'should filter user IDs',
            input: Client4.getUserRoute('1234'),
            expected: `${Client4.urlVersion}/users/<filtered>`,
        }, {
            name: 'should filter email addresses',
            input: `${Client4.getUsersRoute()}/email/test@example.com`,
            expected: `${Client4.urlVersion}/users/email/<filtered>`,
        }, {
            name: 'should filter query parameters',
            input: `${Client4.getUserRoute('me')}?foo=bar`,
            expected: `${Client4.urlVersion}/users/me?<filtered>`,
        }];

        for (const test of tests) {
            it(test.name, () => {
                expect(cleanUrlForLogging(test.input)).toEqual(test.expected);
            });
        }
    });
});
