// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {setCurrentUserStatusOffline} from '@actions/views/user';
import {UserTypes} from '@mm-redux/action_types';
import {General} from '@mm-redux/constants';

const mockStore = configureStore([thunk]);

jest.mock('@mm-redux/actions/users', () => ({
    getStatus: (...args) => ({type: 'MOCK_GET_STATUS', args}),
    getStatusesByIds: (...args) => ({type: 'MOCK_GET_STATUS_BY_IDS', args}),
    startPeriodicStatusUpdates: () => ({type: 'MOCK_PERIODIC_STATUS_UPDATES'}),
}));

describe('Actions.Views.User', () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            entities: {
                users: {
                    currentUserId: 'current-user-id',
                    statuses: {
                        'current-user-id': 'online',
                        'another-user-id1': 'away',
                        'another-user-id2': 'dnd',
                    },
                },
            },
        });
    });

    test('should set the current user as offline', async () => {
        const action = {
            type: UserTypes.RECEIVED_STATUS,
            data: {
                user_id: 'current-user-id',
                status: General.OFFLINE,
            },
        };

        await store.dispatch(setCurrentUserStatusOffline());
        expect(store.getActions()).toEqual([action]);
    });
});
