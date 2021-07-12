// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {ViewTypes} from '@constants';

class EphemeralStore {
    constructor() {
        this.allNavigationComponentIds = [];
        this.appStarted = false;
        this.appStartedFromPushNotification = false;
        this.deviceToken = null;
        this.currentServerUrl = null;
        this.navigationComponentIdStack = [];
        this.navigationModalStack = [];
        this.safeAreaInsets = {
            [ViewTypes.PORTRAIT]: null,
            [ViewTypes.LANDSCAPE]: null,
        };
    }

    getNavigationTopComponentId = () => this.navigationComponentIdStack[0];

    clearNavigationComponents = () => {
        this.navigationComponentIdStack = [];
        this.navigationModalStack = [];
        this.allNavigationComponentIds = [];
    };

    clearNavigationModals = () => {
        this.navigationModalStack = [];
    }

    addNavigationComponentId = (componentId) => {
        this.addToNavigationComponentIdStack(componentId);
        this.addToAllNavigationComponentIds(componentId);
    };

    addNavigationModal = (componentId) => {
        this.navigationModalStack.unshift(componentId);
    }

    addToNavigationComponentIdStack = (componentId) => {
        const index = this.navigationComponentIdStack.indexOf(componentId);
        if (index > 0) {
            this.navigationComponentIdStack.slice(index, 1);
        }

        this.navigationComponentIdStack.unshift(componentId);
    }

    addToAllNavigationComponentIds = (componentId) => {
        if (!this.allNavigationComponentIds.includes(componentId)) {
            this.allNavigationComponentIds.unshift(componentId);
        }
    }

    hasModalsOpened = () => this.navigationModalStack.length > 0;

    removeNavigationComponentId = (componentId) => {
        const index = this.navigationComponentIdStack.indexOf(componentId);
        if (index >= 0) {
            this.navigationComponentIdStack.splice(index, 1);
        }
    }

    removeNavigationModal = (componentId) => {
        const index = this.navigationModalStack.indexOf(componentId);

        if (index >= 0) {
            this.navigationModalStack.splice(index, 1);
        }
    }

    getStartFromNotification = () => {
        return this.appStartedFromPushNotification;
    };

    setStartFromNotification = (value) => {
        this.appStartedFromPushNotification = value;
    };
}

export default new EphemeralStore();
