// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {Client} from '@client/rest';
import {cleanUrlForLogging} from '@mm-redux/utils/sentry';

describe('utils/sentry', () => {
    describe('cleanUrlForLogging', () => {
        const baseUrl = 'https://mattermost.example.com/subpath';

        const client = new Client();
        client.setUrl(baseUrl);

        const tests = [{
            name: 'should remove server URL',
            input: client.getUserRoute('me'),
            expected: `${client.urlVersion}/users/me`,
        }, {
            name: 'should filter user IDs',
            input: client.getUserRoute('1234'),
            expected: `${client.urlVersion}/users/<filtered>`,
        }, {
            name: 'should filter email addresses',
            input: `${client.getUsersRoute()}/email/test@example.com`,
            expected: `${client.urlVersion}/users/email/<filtered>`,
        }, {
            name: 'should filter query parameters',
            input: `${client.getUserRoute('me')}?foo=bar`,
            expected: `${client.urlVersion}/users/me?<filtered>`,
        }];

        for (const test of tests) {
            it(test.name, () => {
                assert.equal(cleanUrlForLogging(baseUrl, test.input), test.expected);
            });
        }
    });
});
