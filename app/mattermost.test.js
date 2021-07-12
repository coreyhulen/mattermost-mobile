// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {NavigationTypes} from '@constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import EphemeralStore from '@store/ephemeral_store';

import {
    componentDidAppearListener,
    componentDidDisappearListener,
} from './mattermost';

describe('componentDidAppearListener', () => {
    EphemeralStore.addNavigationComponentId = jest.fn();
    EventEmitter.emit = jest.fn();

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should add navigation component ID to the ephemeral store', () => {
        expect(EphemeralStore.addNavigationComponentId).not.toHaveBeenCalled();

        const componentId = 'component-id';
        componentDidAppearListener({componentId});
        expect(EphemeralStore.addNavigationComponentId).toHaveBeenCalledWith(componentId);
    });

    it('should emit events when the componentId is MainSidebar', () => {
        expect(EventEmitter.emit).not.toHaveBeenCalled();

        let componentId = 'component-id';
        componentDidAppearListener({componentId});
        expect(EventEmitter.emit).not.toHaveBeenCalled();

        componentId = 'MainSidebar';
        componentDidAppearListener({componentId});
        expect(EventEmitter.emit).toHaveBeenCalledTimes(2);
        expect(EventEmitter.emit).toHaveBeenCalledWith(NavigationTypes.MAIN_SIDEBAR_DID_OPEN, undefined);
        expect(EventEmitter.emit).toHaveBeenCalledWith(NavigationTypes.BLUR_POST_DRAFT);
    });

    it('should emit event when the componentId is SettingsSidebar', () => {
        expect(EventEmitter.emit).not.toHaveBeenCalled();

        let componentId = 'component-id';
        componentDidAppearListener({componentId});
        expect(EventEmitter.emit).not.toHaveBeenCalled();

        componentId = 'SettingsSidebar';
        componentDidAppearListener({componentId});
        expect(EventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(EventEmitter.emit).toHaveBeenCalledWith(NavigationTypes.BLUR_POST_DRAFT);
    });
});

describe('componentDidDisappearListener', () => {
    EphemeralStore.removeNavigationComponentId = jest.fn();
    EventEmitter.emit = jest.fn();

    it('should remove navigation component ID from the ephemeral store', () => {
        expect(EphemeralStore.removeNavigationComponentId).not.toHaveBeenCalled();

        const componentId = 'component-id';
        componentDidDisappearListener({componentId});
        expect(EphemeralStore.removeNavigationComponentId).toHaveBeenCalledWith(componentId);
    });

    it('should emit event when the componentId is MainSidebar', () => {
        expect(EventEmitter.emit).not.toHaveBeenCalled();

        let componentId = 'component-id';
        componentDidDisappearListener({componentId});
        expect(EventEmitter.emit).not.toHaveBeenCalled();

        componentId = 'MainSidebar';
        componentDidDisappearListener({componentId});
        expect(EventEmitter.emit).toHaveBeenCalledTimes(1);
        expect(EventEmitter.emit).toHaveBeenCalledWith(NavigationTypes.MAIN_SIDEBAR_DID_CLOSE);
    });
});
