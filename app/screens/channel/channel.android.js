// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {StyleSheet, View, BackHandler, ToastAndroid} from 'react-native';

import {openMainSideMenu, openSettingsSideMenu} from '@actions/navigation';
import AnnouncementBanner from '@components/announcement_banner';
import InteractiveDialogController from '@components/interactive_dialog_controller';
import KeyboardLayout from '@components/layout/keyboard_layout';
import NetworkIndicator from '@components/network_indicator';
import PostDraft from '@components/post_draft';
import {NavigationTypes} from '@constants';
import EventEmitter from '@mm-redux/utils/event_emitter';
import EphemeralStore from '@store/ephemeral_store';

import ChannelBase from './channel_base';
import ChannelNavBar from './channel_nav_bar';
import ChannelPostList from './channel_post_list';

let backPressedCount = 0;

export default class ChannelAndroid extends ChannelBase {
    openMainSidebar = () => {
        EventEmitter.emit(NavigationTypes.BLUR_POST_DRAFT);
        openMainSideMenu();
    };

    openSettingsSidebar = () => {
        EventEmitter.emit(NavigationTypes.BLUR_POST_DRAFT);
        openSettingsSideMenu();
    };

    componentDidMount() {
        super.componentDidMount();
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    }

    handleBackPress = () => {
        if (!backPressedCount && EphemeralStore.getNavigationTopComponentId() === 'Channel') {
            const {formatMessage} = this.context.intl;
            backPressedCount++;
            ToastAndroid.show(formatMessage({
                id: 'mobile.android.back_handler_exit',
                defaultMessage: 'Press back again to exit',
            }), ToastAndroid.SHORT);
            setTimeout(() => {
                backPressedCount = 0;
            }, 2000);
            return true;
        }
        backPressedCount = 0;
        return false;
    };

    componentWillUnmount() {
        super.componentWillUnmount();
        BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
    }

    render() {
        const {theme} = this.props;
        let component = this.renderLoadingOrFailedChannel();

        if (!component) {
            component = (
                <KeyboardLayout>
                    <View
                        testID='channel.screen'
                        style={style.flex}
                    >
                        <ChannelPostList registerTypingAnimation={this.registerTypingAnimation}/>
                    </View>
                    <PostDraft
                        testID='channel.post_draft'
                        ref={this.postDraft}
                        screenId={this.props.componentId}
                        registerTypingAnimation={this.registerTypingAnimation}
                    />
                </KeyboardLayout>
            );
        }

        const drawerContent = (
            <>
                <ChannelNavBar
                    openMainSidebar={this.openMainSidebar}
                    openSettingsSidebar={this.openSettingsSidebar}
                    onPress={this.goToChannelInfo}
                />
                {component}
                <NetworkIndicator/>
                <AnnouncementBanner/>
            </>
        );

        return (
            <>
                <View style={style.flex}>
                    {drawerContent}
                </View>
                <InteractiveDialogController
                    theme={theme}
                />
            </>
        );
    }
}

const style = StyleSheet.create({
    flex: {
        flex: 1,
    },
});
