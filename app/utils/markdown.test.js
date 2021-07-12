// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Platform} from 'react-native';

import {switchKeyboardForCodeBlocks} from './markdown';

describe('switchKeyboardForCodeBlocks', () => {
    const testCases = [{
        name: 'Empty text input',
        value: '',
        cursorPosition: 0,
        expected: 'default',
    }, {
        name: 'Cursor within an open Code Block',
        value: '```',
        cursorPosition: 3,
        expected: 'email-address',
    }, {
        name: 'Cursor within a closed Code Block',
        value: '```\ntest\n```',
        cursorPosition: 4,
        expected: 'email-address',
    }, {
        name: 'Cursor outside AFTER a closed Code Block',
        value: '```\ntest\n```\ntest',
        cursorPosition: 14,
        expected: 'default',
    }, {
        name: 'Cursor outside BEFORE a closed Code Block',
        value: 'test\n```\ntest\n```',
        cursorPosition: 4,
        expected: 'default',
    }, {
        name: 'Cursor outside BEFORE an open Code Block',
        value: 'test\n```',
        cursorPosition: 4,
        expected: 'default',
    }, {
        name: 'Cursor outside between two Code Blocks',
        value: '```\ntest\n```\ntest\n```\ntest',
        cursorPosition: 14,
        expected: 'default',
    }, {
        name: 'Opening triple backtick not on its own line - text after backticks',
        value: '```test',
        cursorPosition: 3,
        expected: 'default',
    }, {
        name: 'Opening triple backtick not on its own line - text before backticks',
        value: 'test```',
        cursorPosition: 7,
        expected: 'default',
    }, {
        name: 'Closing triple backtick not on its own line - text after backticks',
        value: '```\ntest\n```test',
        cursorPosition: 12,
        expected: 'email-address',
    }, {
        name: 'Closing triple backtick not on its own line - text before backticks',
        value: '```\ntest\ntest```',
        cursorPosition: 16,
        expected: 'email-address',
    }];

    for (const testCase of testCases) {
        it(`test - ${testCase.name}`, () => {
            expect(switchKeyboardForCodeBlocks(testCase.value, testCase.cursorPosition)).toEqual(testCase.expected);
        });
    }
});

describe('switchKeyboardForCodeBlocks for iOS 11', () => {
    it('Should return default keyboard', () => {
        Platform.Version = 11;
        expect(switchKeyboardForCodeBlocks('```\ntest\n```test', 12)).toEqual('default');
        Platform.Version = 12;
    });
});
