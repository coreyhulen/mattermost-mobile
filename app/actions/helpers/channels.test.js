// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable no-import-assign */

import {Client4} from '@client/rest';
import {PreferenceTypes} from '@mm-redux/action_types';
import {Preferences} from '@mm-redux/constants';
import * as CommonSelectors from '@mm-redux/selectors/entities/common';
import * as PreferenceSelectors from '@mm-redux/selectors/entities/preferences';
import * as PreferenceUtils from '@mm-redux/utils/preference_utils';

import {
    makeDirectChannelVisibleIfNecessary,
    makeGroupMessageVisibleIfNecessary,
} from './channels';

describe('Actions.Helpers.Channels', () => {
    describe('makeDirectChannelVisibleIfNecessary', () => {
        const state = {};
        const currentUserId = 'current-user-id';
        const otherUserId = 'other-user-id';

        CommonSelectors.getCurrentUserId = jest.fn().mockReturnValue(currentUserId);
        PreferenceSelectors.getMyPreferences = jest.fn();
        PreferenceUtils.getPreferenceKey = jest.fn();
        Client4.savePreferences = jest.fn();

        beforeEach(() => {
            PreferenceSelectors.getMyPreferences.mockClear();
            PreferenceUtils.getPreferenceKey.mockClear();
            Client4.savePreferences.mockClear();
        });

        it('makes direct channel visible when visibility preference does not exist', () => {
            PreferenceSelectors.getMyPreferences.mockReturnValueOnce({});

            const expectedResult = {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: [{
                    user_id: currentUserId,
                    category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW,
                    name: otherUserId,
                    value: 'true',
                }],
            };

            const result = makeDirectChannelVisibleIfNecessary(state, otherUserId);
            expect(result).toStrictEqual(expectedResult);

            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledTimes(1);
            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledWith(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUserId);
            expect(Client4.savePreferences).toHaveBeenCalledTimes(1);
            expect(Client4.savePreferences).toHaveBeenCalledWith(currentUserId, expectedResult.data);
        });

        it('makes direct channel visible when visibilty preference is false', () => {
            const preference = {value: 'false'};
            const preferenceKey = 'preference-key';
            PreferenceSelectors.getMyPreferences.mockReturnValueOnce({
                [preferenceKey]: preference,
            });
            PreferenceUtils.getPreferenceKey.mockReturnValueOnce(preferenceKey);

            const expectedResult = {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: [{
                    user_id: currentUserId,
                    category: Preferences.CATEGORY_DIRECT_CHANNEL_SHOW,
                    name: otherUserId,
                    value: 'true',
                }],
            };

            const result = makeDirectChannelVisibleIfNecessary(state, otherUserId);
            expect(result).toStrictEqual(expectedResult);

            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledTimes(1);
            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledWith(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUserId);
            expect(Client4.savePreferences).toHaveBeenCalledTimes(1);
            expect(Client4.savePreferences).toHaveBeenCalledWith(currentUserId, expectedResult.data);
        });

        it('does nothing if direct channel visibility preference is true', () => {
            const preference = {value: 'true'};
            const preferenceKey = 'preference-key';
            PreferenceSelectors.getMyPreferences.mockReturnValueOnce({
                [preferenceKey]: preference,
            });
            PreferenceUtils.getPreferenceKey.mockReturnValueOnce(preferenceKey);

            const result = makeDirectChannelVisibleIfNecessary(state, otherUserId);
            expect(result).toEqual(null);

            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledTimes(1);
            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledWith(Preferences.CATEGORY_DIRECT_CHANNEL_SHOW, otherUserId);
            expect(Client4.savePreferences).not.toHaveBeenCalled();
        });
    });

    describe('makeGroupMessageVisibleIfNecessary', () => {
        const state = {};
        const currentUserId = 'current-user-id';
        const channelId = 'channel-id';

        CommonSelectors.getCurrentUserId = jest.fn().mockReturnValue(currentUserId);
        PreferenceSelectors.getMyPreferences = jest.fn();
        PreferenceUtils.getPreferenceKey = jest.fn();
        Client4.savePreferences = jest.fn();

        beforeEach(() => {
            PreferenceSelectors.getMyPreferences.mockClear();
            PreferenceUtils.getPreferenceKey.mockClear();
            Client4.savePreferences.mockClear();
        });

        it('makes group channel visible when visibility preference does not exist', async () => {
            PreferenceSelectors.getMyPreferences.mockReturnValueOnce({});

            const expectedPreferenceResult = {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: [{
                    user_id: currentUserId,
                    category: Preferences.CATEGORY_GROUP_CHANNEL_SHOW,
                    name: channelId,
                    value: 'true',
                }],
            };

            const result = await makeGroupMessageVisibleIfNecessary(state, channelId);
            expect(result.length).toEqual(2);
            expect(result[1]).toStrictEqual(expectedPreferenceResult);

            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledTimes(1);
            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledWith(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channelId);
            expect(Client4.savePreferences).toHaveBeenCalledTimes(1);
            expect(Client4.savePreferences).toHaveBeenCalledWith(currentUserId, expectedPreferenceResult.data);
        });

        it('makes group channel visible when visibilty preference is false', async () => {
            const preference = {value: 'false'};
            const preferenceKey = 'preference-key';
            PreferenceSelectors.getMyPreferences.mockReturnValueOnce({
                [preferenceKey]: preference,
            });
            PreferenceUtils.getPreferenceKey.mockReturnValueOnce(preferenceKey);

            const expectedPreferenceResult = {
                type: PreferenceTypes.RECEIVED_PREFERENCES,
                data: [{
                    user_id: currentUserId,
                    category: Preferences.CATEGORY_GROUP_CHANNEL_SHOW,
                    name: channelId,
                    value: 'true',
                }],
            };

            const result = await makeGroupMessageVisibleIfNecessary(state, channelId);
            expect(result.length).toEqual(2);
            expect(result[1]).toStrictEqual(expectedPreferenceResult);

            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledTimes(1);
            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledWith(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channelId);
            expect(Client4.savePreferences).toHaveBeenCalledTimes(1);
            expect(Client4.savePreferences).toHaveBeenCalledWith(currentUserId, expectedPreferenceResult.data);
        });

        it('does nothing if group channel visibility preference is true', async () => {
            const preference = {value: 'true'};
            const preferenceKey = 'preference-key';
            PreferenceSelectors.getMyPreferences.mockReturnValueOnce({
                [preferenceKey]: preference,
            });
            PreferenceUtils.getPreferenceKey.mockReturnValueOnce(preferenceKey);

            const result = await makeGroupMessageVisibleIfNecessary(state, channelId);
            expect(result).toEqual(null);

            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledTimes(1);
            expect(PreferenceUtils.getPreferenceKey).toHaveBeenCalledWith(Preferences.CATEGORY_GROUP_CHANNEL_SHOW, channelId);
            expect(Client4.savePreferences).not.toHaveBeenCalled();
        });
    });
});
