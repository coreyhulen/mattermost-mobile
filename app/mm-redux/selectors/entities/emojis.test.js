// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {getCustomEmojiIdsSortedByName} from '@mm-redux/selectors/entities/emojis';
import deepFreezeAndThrowOnMutation from '@mm-redux/utils/deep_freeze';
import TestHelper from '@test/test_helper';

describe('Selectors.Integrations', () => {
    TestHelper.initBasic();

    const emoji1 = {id: TestHelper.generateId(), name: 'a', creator_id: TestHelper.generateId()};
    const emoji2 = {id: TestHelper.generateId(), name: 'b', creator_id: TestHelper.generateId()};
    const emoji3 = {id: TestHelper.generateId(), name: '0', creator_id: TestHelper.generateId()};

    const testState = deepFreezeAndThrowOnMutation({
        entities: {
            emojis: {
                customEmoji: {
                    [emoji1.id]: emoji1,
                    [emoji2.id]: emoji2,
                    [emoji3.id]: emoji3,
                },
            },
        },
    });

    it('should get sorted emoji ids', () => {
        assert.deepEqual(getCustomEmojiIdsSortedByName(testState), [emoji3.id, emoji1.id, emoji2.id]);
    });
});
