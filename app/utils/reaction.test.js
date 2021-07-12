// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ALL_EMOJIS} from '@constants/emoji';
import {
    getMissingUserIds,
    getReactionsByName,
    getSortedReactionsForHeader,
    getUniqueUserIds,
} from '@utils/reaction';

describe('getMissingUserIds', () => {
    const testCases = [{
        name: 'Null inputs',
        output: [],
    }, {
        name: 'Should return correct missing user ID, last position',
        userProfilesById: {user_id_1: {}},
        allUserIds: ['user_id_1', 'user_id_2'],
        output: ['user_id_2'],
    }, {
        name: 'Should return correct missing user ID, first position',
        userProfilesById: {user_id_2: {}},
        allUserIds: ['user_id_1', 'user_id_2'],
        output: ['user_id_1'],
    }, {
        name: 'Should return correct missing user ID, mid position',
        userProfilesById: {user_id_3: {}, user_id_1: {}},
        allUserIds: ['user_id_1', 'user_id_2', 'user_id_3'],
        output: ['user_id_2'],
    }, {
        name: 'Should return correct missing user ID, all',
        userProfilesById: {},
        allUserIds: ['user_id_1', 'user_id_2', 'user_id_3'],
        output: ['user_id_1', 'user_id_2', 'user_id_3'],
    }];

    for (const testCase of testCases) {
        it(testCase.name, () => {
            expect(getMissingUserIds(testCase.userProfilesById, testCase.allUserIds)).toEqual(testCase.output);
        });
    }
});

describe('getReactionsByName', () => {
    const testCases = [{
        name: 'Null input',
        output: {},
    }, {
        name: 'Should match reactions by name, single',
        reactions: {'user_id_1-+1': {name: 'thumbs_up', emoji_name: '+1', post_id: 'post_id_1', user_id: 'user_id_1'}},
        output: {'+1': [{emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_1'}]},
    }, {
        name: 'Should match reactions by name, many',
        reactions: {
            'user_id_1-+1': {name: 'thumbs_up', emoji_name: '+1', post_id: 'post_id_1', user_id: 'user_id_1'},
            'user_id_2-+1': {name: 'thumbs_up', emoji_name: '+1', post_id: 'post_id_1', user_id: 'user_id_2'},
        },
        output: {
            '+1': [
                {emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_1'},
                {emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_2'},
            ],
        },
    }, {
        name: 'Should match reactions by name, many names',
        reactions: {
            'user_id_1-+1': {name: 'thumbs_up', emoji_name: '+1', post_id: 'post_id_1', user_id: 'user_id_1'},
            'user_id_2-+1': {name: 'thumbs_up', emoji_name: '+1', post_id: 'post_id_1', user_id: 'user_id_2'},
            'user_id_1--1': {name: 'thumbs_down', emoji_name: '-1', post_id: 'post_id_1', user_id: 'user_id_1'},
        },
        output: {
            '+1': [
                {emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_1'},
                {emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_2'},
            ],
            '-1': [
                {emoji_name: '-1', name: 'thumbs_down', post_id: 'post_id_1', user_id: 'user_id_1'},
            ],
        },
    }];

    for (const testCase of testCases) {
        it(testCase.name, () => {
            expect(getReactionsByName(testCase.reactions)).toEqual(testCase.output);
        });
    }
});

describe('getSortedReactionsForHeader', () => {
    const testCases = [{
        name: 'Null input',
        output: [{count: 0, name: ALL_EMOJIS}],
    }, {
        name: 'Should match reactions for header, single',
        reactionsByName: {'+1': [{emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_1'}]},
        output: [
            {count: 1, name: ALL_EMOJIS},
            {
                count: 1,
                name: '+1',
                reactions: [
                    {emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_1'},
                ],
            },
        ],
    }, {
        name: 'Should match reactions for header, multiple',
        reactionsByName: {
            '+1': [
                {emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_1'},
                {emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_2'},
            ],
            '-1': [
                {emoji_name: '-1', name: 'thumbs_down', post_id: 'post_id_1', user_id: 'user_id_1'},
            ],
        },
        output: [
            {count: 3, name: ALL_EMOJIS},
            {
                count: 2,
                name: '+1',
                reactions: [
                    {emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_1'},
                    {emoji_name: '+1', name: 'thumbs_up', post_id: 'post_id_1', user_id: 'user_id_2'},
                ],
            },
            {
                count: 1,
                name: '-1',
                reactions: [
                    {emoji_name: '-1', name: 'thumbs_down', post_id: 'post_id_1', user_id: 'user_id_1'},
                ],
            },
        ],
    }];

    for (const testCase of testCases) {
        it(testCase.name, () => {
            expect(getSortedReactionsForHeader(testCase.reactionsByName)).toEqual(testCase.output);
        });
    }
});

describe('getUniqueUserIds', () => {
    const testCases = [{
        name: 'Null input',
        output: [],
    }, {
        name: 'Should match unique user ID',
        reactions: {'user_id_1-+1': {name: 'thumbs_up', emoji_name: '+1', post_id: 'post_id_1', user_id: 'user_id_1'}},
        output: ['user_id_1'],
    }, {
        name: 'Should match unique user IDs',
        reactions: {
            'user_id_1-+1': {name: 'thumbs_up', emoji_name: '+1', post_id: 'post_id_1', user_id: 'user_id_1'},
            'user_id_1--1': {name: 'thumbs_down', emoji_name: '-1', post_id: 'post_id_1', user_id: 'user_id_1'},
        },
        output: ['user_id_1'],
    }, {
        name: 'Should match unique user IDs',
        reactions: {
            'user_id_2-smile': {name: 'smile', emoji_name: 'smile', post_id: 'post_id_1', user_id: 'user_id_2'},
            'user_id_1-+1': {name: 'thumbs_up', emoji_name: '+1', post_id: 'post_id_1', user_id: 'user_id_1'},
            'user_id_1--1': {name: 'thumbs_down', emoji_name: '-1', post_id: 'post_id_1', user_id: 'user_id_1'},
        },
        output: ['user_id_2', 'user_id_1'],
    }];

    for (const testCase of testCases) {
        it(testCase.name, () => {
            expect(getUniqueUserIds(testCase.reactions)).toEqual(testCase.output);
        });
    }
});
