// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import AnnouncementBanner from '@components/announcement_banner';
import Autocomplete from '@components/autocomplete';
import InteractiveDialogController from '@components/interactive_dialog_controller';
import NetworkIndicator from '@components/network_indicator';
import PostDraft from '@components/post_draft';
import MainSidebar from '@components/sidebars/main';
import SettingsSidebar from '@components/sidebars/settings';
import StatusBar from '@components/status_bar';
import DEVICE from '@constants/device';
import {ACCESSORIES_CONTAINER_NATIVE_ID, CHANNEL_POST_TEXTBOX_CURSOR_CHANGE, CHANNEL_POST_TEXTBOX_VALUE_CHANGE} from '@constants/post_draft';
import {makeStyleSheetFromTheme} from '@utils/theme';

import ChannelBase from './channel_base';
import ChannelNavBar from './channel_nav_bar';
import ChannelPostList from './channel_post_list';

export default class ChannelIOS extends ChannelBase {
    handleAutoComplete = (value) => {
        if (this.postDraft?.current) {
            this.postDraft.current.handleInputQuickAction(value);
        }
    };

    mainSidebarRef = (ref) => {
        if (ref) {
            this.mainSidebar = ref;
        }
    };

    settingsSidebarRef = (ref) => {
        if (ref) {
            this.settingsSidebar = ref;
        }
    };

    openMainSidebar = () => {
        if (this.mainSidebar) {
            this.mainSidebar.open();
        }
    };

    openSettingsSidebar = () => {
        if (this.settingsSidebar) {
            this.settingsSidebar.open();
        }
    };

    render() {
        const {currentChannelId, theme} = this.props;
        let component = this.renderLoadingOrFailedChannel();
        let renderDraftArea = false;

        if (!component) {
            renderDraftArea = true;
            component = (
                <>
                    <ChannelPostList registerTypingAnimation={this.registerTypingAnimation}/>
                </>
            );
        }

        const style = getStyle(theme);
        const indicators = (
            <>
                <AnnouncementBanner/>
                <NetworkIndicator/>
            </>
        );
        const header = (
            <>
                <ChannelNavBar
                    openMainSidebar={this.openMainSidebar}
                    openSettingsSidebar={this.openSettingsSidebar}
                    onPress={this.goToChannelInfo}
                />
            </>
        );
        const drawerContent = (
            <>
                <StatusBar/>
                {header}
                <SafeAreaView
                    mode='margin'
                    edges={['left', 'right', 'bottom']}
                    style={style.flex}
                >
                    {component}
                </SafeAreaView>
                {indicators}
                <View nativeID={ACCESSORIES_CONTAINER_NATIVE_ID}>
                    <Autocomplete
                        maxHeight={DEVICE.AUTOCOMPLETE_MAX_HEIGHT}
                        onChangeText={this.handleAutoComplete}
                        cursorPositionEvent={CHANNEL_POST_TEXTBOX_CURSOR_CHANGE}
                        valueEvent={CHANNEL_POST_TEXTBOX_VALUE_CHANGE}
                        channelId={currentChannelId}
                        offsetY={0}
                    />
                </View>
                {renderDraftArea &&
                    <PostDraft
                        testID='channel.post_draft'
                        accessoriesContainerID={ACCESSORIES_CONTAINER_NATIVE_ID}
                        cursorPositionEvent={CHANNEL_POST_TEXTBOX_CURSOR_CHANGE}
                        ref={this.postDraft}
                        registerTypingAnimation={this.registerTypingAnimation}
                        screenId={this.props.componentId}
                        scrollViewNativeID={currentChannelId}
                        valueEvent={CHANNEL_POST_TEXTBOX_VALUE_CHANGE}
                    />
                }
            </>
        );

        return (
            <MainSidebar
                testID='channel.screen'
                ref={this.mainSidebarRef}
            >
                <SettingsSidebar ref={this.settingsSidebarRef}>
                    <View style={style.backdrop}>
                        {drawerContent}
                    </View>
                </SettingsSidebar>
                <InteractiveDialogController
                    theme={theme}
                />
            </MainSidebar>
        );
    }
}

const getStyle = makeStyleSheetFromTheme((theme) => ({
    backdrop: {
        flex: 1,
        backgroundColor: theme.centerChannelBg,
    },
    flex: {
        flex: 1,
    },
}));
