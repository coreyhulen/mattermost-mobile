// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Animated, View} from 'react-native';

import Autocomplete from '@components/autocomplete';
import Loading from '@components/loading';
import PostDraft from '@components/post_draft';
import PostList from '@components/post_list';
import SafeAreaView from '@components/safe_area_view';
import StatusBar from '@components/status_bar';
import DEVICE from '@constants/device';
import {THREAD} from '@constants/screen';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

import ThreadBase from './thread_base';

const ACCESSORIES_CONTAINER_NATIVE_ID = 'threadAccessoriesContainer';
const THREAD_POST_TEXTBOX_CURSOR_CHANGE = 'onThreadTextBoxCursorChange';
const THREAD_POST_TEXTBOX_VALUE_CHANGE = 'onThreadTextBoxValueChange';
const SCROLLVIEW_NATIVE_ID = 'threadPostList';

export default class ThreadIOS extends ThreadBase {
    handleAutoComplete = (value) => {
        if (this.postDraft?.current) {
            this.postDraft.current.handleInputQuickAction(value);
        }
    };

    render() {
        const {
            channelId,
            myMember,
            postIds,
            rootId,
            channelIsArchived,
            theme,
        } = this.props;

        let content;
        let postDraft;
        if (this.hasRootPost()) {
            content = (
                <>
                    <Animated.View
                        testID='thread.screen'
                        style={{flex: 1, paddingBottom: this.bottomPadding}}
                    >
                        <PostList
                            testID='thread.post_list'
                            renderFooter={this.renderFooter()}
                            indicateNewMessages={false}
                            postIds={postIds}
                            currentUserId={myMember && myMember.user_id}
                            lastViewedAt={this.state.lastViewedAt}
                            location={THREAD}
                            rootId={rootId}
                            scrollViewNativeID={SCROLLVIEW_NATIVE_ID}
                        />
                    </Animated.View>
                </>
            );

            postDraft = (
                <PostDraft
                    testID='thread.post_draft'
                    accessoriesContainerID={ACCESSORIES_CONTAINER_NATIVE_ID}
                    channelId={channelId}
                    channelIsArchived={channelIsArchived}
                    cursorPositionEvent={THREAD_POST_TEXTBOX_CURSOR_CHANGE}
                    ref={this.postDraft}
                    rootId={rootId}
                    screenId={this.props.componentId}
                    scrollViewNativeID={SCROLLVIEW_NATIVE_ID}
                    valueEvent={THREAD_POST_TEXTBOX_VALUE_CHANGE}
                    registerTypingAnimation={this.registerTypingAnimation}
                />
            );
        } else {
            content = (
                <Loading color={theme.centerChannelColor}/>
            );
        }

        const style = getStyleSheet(theme);
        return (
            <React.Fragment>
                <SafeAreaView
                    excludeHeader={true}
                    forceInsets={true}
                >
                    <View style={style.separator}/>
                    <StatusBar/>
                    {content}
                </SafeAreaView>
                <View nativeID={ACCESSORIES_CONTAINER_NATIVE_ID}>
                    <Autocomplete
                        maxHeight={DEVICE.AUTOCOMPLETE_MAX_HEIGHT}
                        onChangeText={this.handleAutoComplete}
                        cursorPositionEvent={THREAD_POST_TEXTBOX_CURSOR_CHANGE}
                        valueEvent={THREAD_POST_TEXTBOX_VALUE_CHANGE}
                        rootId={rootId}
                        channelId={channelId}
                        offsetY={0}
                    />
                </View>
                {postDraft}
            </React.Fragment>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => ({
    separator: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
        height: 1,
    },
}));
