// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {ReactElement, useCallback, useEffect, useRef} from 'react';
import {StyleSheet, View} from 'react-native';

import {dismissModal} from '@actions/navigation';
import SlideUpPanel from '@components/slide_up_panel';
import {NavigationTypes} from '@constants';
import EventEmitter from '@mm-redux/utils/event_emitter';

import type {Theme} from '@mm-redux/types/preferences';

type Props = {
    allowStayMiddle?: boolean;
    containerHeight?: number;
    children: ReactElement;
    header?: () => ReactElement;
    headerHeight?: number;
    initialPosition?: number;
    marginFromTop?: number;
    onRequestClose?: () => void;
    theme: Theme;
}

type SlideUpPanelRef = {
    closeWithAnimation: () => void;
}

const style = StyleSheet.create({
    flex: {flex: 1},
});

const SlideUp = (props: Props) => {
    const {children, ...otherProps} = props;
    const slideUpPanel = useRef<SlideUpPanelRef>();

    const onClose = useCallback(() => {
        slideUpPanel.current?.closeWithAnimation();
        dismissModal();
    }, []);

    useEffect(() => {
        EventEmitter.on(NavigationTypes.CLOSE_SLIDE_UP, onClose);
        return () => EventEmitter.off(NavigationTypes.CLOSE_SLIDE_UP, onClose);
    }, []);

    return (
        <View style={style.flex}>
            <SlideUpPanel
                {...otherProps}
                onRequestClose={onClose}

                // @ts-expect-error no ref typing for JS file
                ref={slideUpPanel}
            >
                {children}
            </SlideUpPanel>
        </View>
    );
};

export default SlideUp;
