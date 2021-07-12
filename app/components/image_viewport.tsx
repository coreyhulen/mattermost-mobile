// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import AsyncStorage from '@react-native-community/async-storage';

import {PureComponent} from 'react';
import {Dimensions} from 'react-native';

import {DeviceTypes} from '@constants';
import mattermostManaged from '@mattermost-managed';
import EventEmitter from '@mm-redux/utils/event_emitter';

// TODO: Use permanentSidebar and splitView hooks instead
export default class ImageViewPort extends PureComponent {
    mounted = false;
    state = {
        isSplitView: false,
        permanentSidebar: false,
    };

    componentDidMount() {
        this.mounted = true;
        this.handlePermanentSidebar();
        this.handleDimensions();
        EventEmitter.on(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS, this.handlePermanentSidebar);
        Dimensions.addEventListener('change', this.handleDimensions);
    }

    componentWillUnmount() {
        this.mounted = false;
        EventEmitter.off(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS, this.handlePermanentSidebar);
        Dimensions.removeEventListener('change', this.handleDimensions);
    }

    handleDimensions = () => {
        if (this.mounted) {
            if (DeviceTypes.IS_TABLET) {
                mattermostManaged.isRunningInSplitView().then((result: any) => {
                    const isSplitView = Boolean(result.isSplitView);
                    this.setState({isSplitView});
                });
            }
        }
    };

    handlePermanentSidebar = async () => {
        if (DeviceTypes.IS_TABLET && this.mounted) {
            const enabled = await AsyncStorage.getItem(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS);
            this.setState({permanentSidebar: enabled === 'true'});
        }
    };

    hasPermanentSidebar = () => {
        return DeviceTypes.IS_TABLET && !this.state.isSplitView && this.state.permanentSidebar;
    };

    render() {
        return null;
    }
}
