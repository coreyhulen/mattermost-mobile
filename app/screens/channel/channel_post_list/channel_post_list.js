// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Keyboard, View, Animated} from 'react-native';

import {goToScreen} from '@actions/navigation';
import PostList from '@components/post_list';
import RetryBarIndicator from '@components/retry_bar_indicator';
import {TYPING_HEIGHT} from '@constants/post_draft';
import EventEmitter from '@mm-redux/utils/event_emitter';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';
import {CHANNEL, THREAD} from '@constants/screen';

let ChannelIntro = null;
let LoadMorePosts = null;

export default class ChannelPostList extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            loadPostsIfNecessaryWithRetry: PropTypes.func.isRequired,
            getPostThread: PropTypes.func.isRequired,
            increasePostVisibility: PropTypes.func.isRequired,
            selectPost: PropTypes.func.isRequired,
            setChannelRefreshing: PropTypes.func,
        }).isRequired,
        channelId: PropTypes.string.isRequired,
        channelRefreshingFailed: PropTypes.bool,
        currentUserId: PropTypes.string,
        lastViewedAt: PropTypes.number,
        loadMorePostsVisible: PropTypes.bool.isRequired,
        postIds: PropTypes.array,
        refreshing: PropTypes.bool.isRequired,
        theme: PropTypes.object.isRequired,
        registerTypingAnimation: PropTypes.func.isRequired,
    };

    static defaultProps = {
        postIds: [],
    };

    constructor(props) {
        super(props);

        this.contentHeight = 0;

        this.isLoadingMoreBottom = false;
        this.isLoadingMoreTop = false;

        this.bottomPadding = new Animated.Value(0);
    }

    componentDidMount() {
        EventEmitter.on('goToThread', this.goToThread);
        this.removeTypingAnimation = this.props.registerTypingAnimation(this.bottomPaddingAnimation);
    }

    componentDidUpdate(prevProps) {
        if (this.props.channelId !== prevProps.channelId) {
            this.isLoadingMoreTop = false;
        }
    }

    componentWillUnmount() {
        EventEmitter.off('goToThread', this.goToThread);
        this.removeTypingAnimation();
    }

    bottomPaddingAnimation = (visible) => {
        const [padding, duration] = visible ?
            [TYPING_HEIGHT, 200] :
            [0, 400];

        return Animated.timing(this.bottomPadding, {
            toValue: padding,
            duration,
            useNativeDriver: false,
        });
    }

    goToThread = (post) => {
        const {actions} = this.props;
        const rootId = (post.root_id || post.id);

        Keyboard.dismiss();
        actions.getPostThread(rootId);
        actions.selectPost(rootId);

        const screen = THREAD;
        const title = '';
        const passProps = {
            channelId: post.channel_id,
            rootId,
        };

        requestAnimationFrame(() => {
            goToScreen(screen, title, passProps);
        });
    };

    loadMorePostsTop = () => {
        const {actions, channelId, postIds} = this.props;
        if (!this.isLoadingMoreTop) {
            this.isLoadingMoreTop = true;
            actions.increasePostVisibility(
                channelId,
                postIds[postIds.length - 1],
            ).then((hasMore) => {
                this.isLoadingMoreTop = !hasMore;
            });
        }
    };

    loadPostsRetry = () => {
        const {actions, channelId} = this.props;
        actions.loadPostsIfNecessaryWithRetry(channelId);
    };

    renderFooter = () => {
        if (!this.props.channelId) {
            return null;
        }

        if (this.props.loadMorePostsVisible) {
            if (!LoadMorePosts) {
                LoadMorePosts = require('app/components/load_more_posts').default;
            }

            return (
                <LoadMorePosts
                    channelId={this.props.channelId}
                    loadMore={this.loadMorePostsTop}
                    theme={this.props.theme}
                />
            );
        }

        if (!ChannelIntro) {
            ChannelIntro = require('app/components/channel_intro').default;
        }

        return (
            <ChannelIntro
                channelId={this.props.channelId}
                emptyChannel={this.props.postIds.length === 0}
            />
        );
    };

    render() {
        const {
            actions,
            channelId,
            channelRefreshingFailed,
            currentUserId,
            lastViewedAt,
            postIds,
            refreshing,
            theme,
        } = this.props;

        let component;

        if (postIds.length === 0 && channelRefreshingFailed) {
            const FailedNetworkAction = require('app/components/failed_network_action').default;

            component = (
                <FailedNetworkAction
                    onRetry={this.loadPostsRetry}
                    theme={theme}
                />
            );
        } else if (channelId) {
            component = (
                <PostList
                    testID='channel.post_list'
                    postIds={postIds}
                    extraData={postIds.length !== 0}
                    onLoadMoreUp={this.loadMorePostsTop}
                    onRefresh={actions.setChannelRefreshing}
                    indicateNewMessages={true}
                    currentUserId={currentUserId}
                    lastViewedAt={lastViewedAt}
                    channelId={channelId}
                    renderFooter={this.renderFooter}
                    refreshing={refreshing}
                    scrollViewNativeID={channelId}
                    loadMorePostsVisible={this.props.loadMorePostsVisible}
                    showMoreMessagesButton={true}
                    location={CHANNEL}
                />
            );
        }

        const style = getStyleSheet(theme);

        return (
            <Animated.View style={[style.container, {paddingBottom: this.bottomPadding}]}>
                <View style={style.separator}/>
                {component}
                <RetryBarIndicator/>
            </Animated.View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => ({
    container: {
        flex: 1,
    },
    separator: {
        backgroundColor: changeOpacity(theme.centerChannelColor, 0.2),
        height: 1,
    },
}));
