// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {getKeyboardAppearanceFromTheme} from '@utils/theme';

describe('getKeyboardAppearanceFromTheme', () => {
    const themes = [{
        centerChannelBg: '#ffffff', // Mattermost
    }, {
        centerChannelBg: '#f2f4f8', // Organization
    }, {
        centerChannelBg: '#2f3e4e', // Mattermost Dark
    }, {
        centerChannelBg: '#1f1f1f', // Windows Dark
    }];

    it('should return "light" keyboard appearance for centerChannelBg="#ffffff"', () => {
        const keyboardAppearance = getKeyboardAppearanceFromTheme(themes[0]);
        expect(keyboardAppearance).toBe('light');
    });

    it('should return "light" keyboard appearance for centerChannelBg="#f2f4f8"', () => {
        const keyboardAppearance = getKeyboardAppearanceFromTheme(themes[1]);
        expect(keyboardAppearance).toBe('light');
    });

    it('should return "dark" keyboard appearance for centerChannelBg="#2f3e4e"', () => {
        const keyboardAppearance = getKeyboardAppearanceFromTheme(themes[2]);
        expect(keyboardAppearance).toBe('dark');
    });

    it('should return "dark" keyboard appearance for centerChannelBg="#1f1f1f"', () => {
        const keyboardAppearance = getKeyboardAppearanceFromTheme(themes[3]);
        expect(keyboardAppearance).toBe('dark');
    });
});
