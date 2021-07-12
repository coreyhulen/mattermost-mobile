// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {generateChannelNameFromDisplayName} from '@actions/views/create_channel';

describe('Actions.Views.CreateChannel', () => {
    describe('generateChannelNameFromDisplayName', () => {
        test('should not change name', async () => {
            expect(generateChannelNameFromDisplayName('abc')).toEqual('abc');
        });

        test('should generate name from non-latin characters', async () => {
            expect(generateChannelNameFromDisplayName('熊本').length).toEqual(36);
        });

        test('should generate name from blank string', async () => {
            expect(generateChannelNameFromDisplayName('').length).toEqual(36);
        });
    });
});
