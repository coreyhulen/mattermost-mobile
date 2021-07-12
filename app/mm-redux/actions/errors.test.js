// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import nock from 'nock';

import {Client4} from '@client/rest';
import {logError} from '@mm-redux/actions/errors';
import TestHelper from '@test/test_helper';
import configureStore from '@test/test_store';

describe('Actions.Errors', () => {
    let store;
    beforeAll(async () => {
        await TestHelper.initBasic(Client4);
        Client4.setEnableLogging(true);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    afterAll(async () => {
        await TestHelper.tearDown();
        Client4.setEnableLogging(false);
    });

    it('logError should hit /logs endpoint, unless server error', async () => {
        let count = 0;

        nock(Client4.getBaseRoute()).
            post('/logs').
            reply(200, () => {
                count++;
                return '{}';
            }).
            post('/logs').
            reply(200, () => {
                count++;
                return '{}';
            }).
            post('/logs').
            reply(200, () => {
                count++;
                return '{}';
            });

        await store.dispatch(logError({message: 'error'}));
        await store.dispatch(logError({message: 'error', server_error_id: 'error_id'}));
        await store.dispatch(logError({message: 'error'}));

        if (count > 2) {
            assert.fail(`should not hit /logs endpoint, called ${count} times`);
        }

        await store.dispatch(logError({message: 'error', server_error_id: 'api.context.session_expired.app_error'}));

        if (count > 2) {
            assert.fail('should not add session expired errors to the reducer');
        }
    });
});
