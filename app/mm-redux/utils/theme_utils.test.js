// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import assert from 'assert';

import * as ThemeUtils from '@mm-redux/utils/theme_utils';

import {Preferences} from '../constants';

describe('ThemeUtils', () => {
    describe('getComponents', () => {
        it('hex color', () => {
            const input = 'ff77aa';
            const expected = {red: 255, green: 119, blue: 170, alpha: 1};

            assert.deepEqual(ThemeUtils.getComponents(input), expected);
        });

        it('3 digit hex color', () => {
            const input = '4a3';
            const expected = {red: 68, green: 170, blue: 51, alpha: 1};

            assert.deepEqual(ThemeUtils.getComponents(input), expected);
        });

        it('hex color with leading number sign', () => {
            const input = '#cda43d';
            const expected = {red: 205, green: 164, blue: 61, alpha: 1};

            assert.deepEqual(ThemeUtils.getComponents(input), expected);
        });

        it('rgb', () => {
            const input = 'rgb(123,231,67)';
            const expected = {red: 123, green: 231, blue: 67, alpha: 1};

            assert.deepEqual(ThemeUtils.getComponents(input), expected);
        });

        it('rgba', () => {
            const input = 'rgb(45,67,89,0.04)';
            const expected = {red: 45, green: 67, blue: 89, alpha: 0.04};

            assert.deepEqual(ThemeUtils.getComponents(input), expected);
        });
    });

    describe('changeOpacity', () => {
        it('hex color', () => {
            const input = 'ff77aa';
            const expected = 'rgba(255,119,170,0.5)';

            assert.deepEqual(ThemeUtils.changeOpacity(input, 0.5), expected);
        });

        it('rgb', () => {
            const input = 'rgb(123,231,67)';
            const expected = 'rgba(123,231,67,0.3)';

            assert.deepEqual(ThemeUtils.changeOpacity(input, 0.3), expected);
        });

        it('rgba', () => {
            const input = 'rgb(45,67,89,0.4)';
            const expected = 'rgba(45,67,89,0.2)';

            assert.deepEqual(ThemeUtils.changeOpacity(input, 0.5), expected);
        });
    });

    describe('setThemeDefaults', () => {
        it('blank theme', () => {
            const input = {};
            const expected = {...Preferences.THEMES.default};
            delete expected.type;

            assert.deepEqual(ThemeUtils.setThemeDefaults(input), expected);
        });

        it('set defaults on unset properties only', () => {
            const input = {buttonColor: 'green'};
            assert.equal(ThemeUtils.setThemeDefaults(input).buttonColor, 'green');
        });

        it('ignore type', () => {
            const input = {type: 'sometype'};
            assert.equal(ThemeUtils.setThemeDefaults(input).type, 'sometype');
        });
    });
});
