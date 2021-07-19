// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Alert} from 'react-native';

import {unsupportedServer} from './supported_server';

describe('Unsupported Server Alert', () => {
    const formatMessage = jest.fn();

    it('should show the alert for sysadmin', () => {
        const alert = jest.spyOn(Alert, 'alert');
        unsupportedServer(true, formatMessage);
        expect(alert?.mock?.calls?.[0]?.[2]?.length).toBe(2);
    });

    it('should show the alert for team admin / user', () => {
        const alert = jest.spyOn(Alert, 'alert');
        unsupportedServer(false, formatMessage);
        expect(alert?.mock?.calls?.[0]?.[2]?.length).toBe(1);
    });
});
