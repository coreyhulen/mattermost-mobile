// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import nock from 'nock';
import TestHelper from 'test/test_helper';
import configureStore from 'test/test_store';

import {Client4} from '@client/rest';
import * as Actions from '@mm-redux/actions/roles';

import {RequestStatus} from '../constants';

describe('Actions.Roles', () => {
    let store;

    beforeAll(async () => {
        await TestHelper.initBasic(Client4);
    });

    beforeEach(async () => {
        store = await configureStore();
    });

    afterAll(async () => {
        await TestHelper.tearDown();
    });

    it('getRolesByNames', async () => {
        nock(Client4.getRolesRoute()).
            post('/names').
            reply(200, [TestHelper.basicRoles.system_admin]);
        await Actions.getRolesByNames(['system_admin'])(store.dispatch, store.getState);

        const state = store.getState();
        const request = state.requests.roles.getRolesByNames;
        const {roles} = state.entities.roles;

        if (request.status === RequestStatus.FAILURE) {
            throw new Error(JSON.stringify(request.error));
        }

        assert.equal(roles.system_admin.name, 'system_admin');
        assert.deepEqual(roles.system_admin.permissions, TestHelper.basicRoles.system_admin.permissions);
    });

    it('loadRolesIfNeeded', async () => {
        const mock1 = nock(Client4.getRolesRoute()).
            post('/names', JSON.stringify(['existing_role'])).
            reply(200, []);
        const mock2 = nock(Client4.getRolesRoute()).
            post('/names', JSON.stringify(['new_role'])).
            reply(200, []);

        const fakeState = {
            entities: {
                roles: {
                    roles: {
                        existing_role: {},
                    },
                },
            },
        };
        await Actions.loadRolesIfNeeded(['existing_role'])(store.dispatch, () => fakeState);
        assert(!mock1.isDone());
        assert(!mock2.isDone());

        await Actions.loadRolesIfNeeded(['existing_role', 'new_role', ''])(store.dispatch, () => fakeState);
        assert(!mock1.isDone());
        assert(mock2.isDone());
    });
});
