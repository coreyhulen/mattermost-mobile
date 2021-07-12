// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {handleSuccessfulLogin} from '@actions/views/login';
import {Client4} from '@client/rest';

jest.mock('app/init/credentials', () => ({
    setAppCredentials: () => jest.fn(),
}));

const mockStore = configureStore([thunk]);

describe('Actions.Views.Login', () => {
    let store;

    beforeEach(() => {
        store = mockStore({
            entities: {
                users: {
                    currentUserId: 'current-user-id',
                },
                general: {
                    config: {},
                },
            },
        });
    });

    test('handleSuccessfulLogin gets config and license ', async () => {
        const getClientConfig = jest.spyOn(Client4, 'getClientConfigOld');
        const getLicenseConfig = jest.spyOn(Client4, 'getClientLicenseOld');

        await store.dispatch(handleSuccessfulLogin());
        expect(getClientConfig).toHaveBeenCalled();
        expect(getLicenseConfig).toHaveBeenCalled();
    });
});
