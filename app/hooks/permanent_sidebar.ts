// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import AsyncStorage from '@react-native-community/async-storage';

import {useEffect, useState} from 'react';
import {useWindowDimensions} from 'react-native';

import {DeviceTypes} from '@constants';
import mattermostManaged from '@mattermost-managed';
import EventEmitter from '@mm-redux/utils/event_emitter';

export function usePermanentSidebar() {
    const [permanentSidebar, setPermanentSidebar] = useState(DeviceTypes.IS_TABLET);

    useEffect(() => {
        const handlePermanentSidebar = async () => {
            if (DeviceTypes.IS_TABLET && this.mounted) {
                const enabled = await AsyncStorage.getItem(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS);
                setPermanentSidebar(enabled === 'true');
            }
        };

        handlePermanentSidebar();

        EventEmitter.on(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS, handlePermanentSidebar);

        return () => {
            EventEmitter.off(DeviceTypes.PERMANENT_SIDEBAR_SETTINGS, handlePermanentSidebar);
        };
    }, []);

    return permanentSidebar;
}

export function useSplitView() {
    const [isSplitView, setIsSplitView] = useState(false);
    useWindowDimensions();

    if (DeviceTypes.IS_TABLET) {
        mattermostManaged.isRunningInSplitView().then((result: any) => {
            setIsSplitView(Boolean(result.isSplitView));
        });
    }

    return isSplitView;
}
