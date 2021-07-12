// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import {setLocalizeFunction, localizeMessage} from '@mm-redux/utils/i18n_utils';

const en = require('@assets/i18n/en.json');
const [testKey, testValue] = Object.entries(en)[0];

describe('i18n utils', () => {
    afterEach(() => {
        setLocalizeFunction(null);
    });

    it('should return default message', () => {
        assert.equal(localizeMessage(testKey, testValue), testValue);
    });

    it('should return previously set Localized function return value', () => {
        const prevValue = 'previous-value';
        function mockFunc() {
            return prevValue;
        }

        setLocalizeFunction(mockFunc);
        assert.notEqual(testValue, prevValue);
        assert.equal(localizeMessage(testKey, testValue), prevValue);
    });
});
