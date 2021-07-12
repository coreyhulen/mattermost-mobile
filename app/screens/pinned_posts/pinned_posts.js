// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {
    DeviceEventEmitter,
    FlatList,
    StyleSheet,
} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {SafeAreaView} from 'react-native-safe-area-context';

import {dismissModal} from '@actions/navigation';
import ChannelLoader from '@components/channel_loader';
import FailedNetworkAction from '@components/failed_network_action';
import NoResults from '@components/no_results';
import DateSeparator from '@components/post_list/date_separator';
import PostSeparator from '@components/post_separator';
import StatusBar from '@components/status_bar';
import {isDateLine, getDateForDateLine} from '@mm-redux/utils/post_list';
import SearchResultPost from '@screens/search/search_result_post';

export default class PinnedPosts extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            clearSearch: PropTypes.func.isRequired,
            getPinnedPosts: PropTypes.func.isRequired,
        }).isRequired,
        currentChannelId: PropTypes.string.isRequired,
        postIds: PropTypes.array,
        theme: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            didFail: false,
            isLoading: false,
        };
    }

    static defaultProps = {
        postIds: [],
    };

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);

        const {actions} = this.props;
        actions.clearSearch();
        this.getPinnedPosts();
    }

    navigationButtonPressed({buttonId}) {
        if (buttonId === 'close-settings') {
            dismissModal();
        }
    }

    getPinnedPosts = async () => {
        const {actions, currentChannelId} = this.props;

        this.setState({isLoading: true});
        const {error} = await actions.getPinnedPosts(currentChannelId);

        this.setState({
            isLoading: false,
            didFail: Boolean(error),
        });
    }

    setListRef = (ref) => {
        this.listRef = ref;
    }

    keyExtractor = (item) => item;

    onViewableItemsChanged = ({viewableItems}) => {
        if (!viewableItems.length) {
            return;
        }

        const viewableItemsMap = viewableItems.reduce((acc, {item, isViewable}) => {
            if (isViewable) {
                acc[item] = true;
            }
            return acc;
        }, {});

        DeviceEventEmitter.emit('scrolled', viewableItemsMap);
    };

    renderEmpty = () => {
        const {formatMessage} = this.context.intl;
        const {theme} = this.props;

        return (
            <NoResults
                description={formatMessage({
                    id: 'mobile.pinned_posts.empty_description',
                    defaultMessage: 'Pin important messages which are visible to the whole channel. Long press on a message and choose Pin to Channel to save it here.',
                })}
                iconName='pin-outline'
                title={formatMessage({id: 'mobile.pinned_posts.empty_title', defaultMessage: 'No Pinned messages yet'})}
                theme={theme}
            />
        );
    };

    renderPost = ({item, index}) => {
        const {postIds, theme} = this.props;
        if (isDateLine(item)) {
            return (
                <DateSeparator
                    date={getDateForDateLine(item)}
                    theme={theme}
                />
            );
        }

        let separator;
        const nextPost = postIds[index + 1];
        if (nextPost && !isDateLine(nextPost)) {
            separator = <PostSeparator theme={theme}/>;
        }

        return (
            <>
                <SearchResultPost
                    postId={item}
                    highlightPinnedOrFlagged={true}
                    skipFlaggedHeader={false}
                    skipPinnedHeader={true}
                    theme={theme}
                />
                {separator}
            </>
        );
    };

    retry = () => {
        this.getPinnedPosts();
    };

    render() {
        const {postIds, theme} = this.props;
        const {didFail, isLoading} = this.state;

        let component;
        if (didFail) {
            component = (
                <FailedNetworkAction
                    onRetry={this.retry}
                    theme={theme}
                />
            );
        } else if (isLoading) {
            component = (
                <ChannelLoader channelIsLoading={true}/>
            );
        } else if (postIds.length) {
            component = (
                <FlatList
                    ref={this.setListRef}
                    contentContainerStyle={style.sectionList}
                    data={postIds}
                    extraData={theme}
                    keyExtractor={this.keyExtractor}
                    keyboardShouldPersistTaps='always'
                    keyboardDismissMode='interactive'
                    removeClippedSubviews={true}
                    renderItem={this.renderPost}
                    onViewableItemsChanged={this.onViewableItemsChanged}
                />
            );
        } else {
            component = this.renderEmpty();
        }

        return (
            <SafeAreaView
                testID='pinned_messages.screen'
                edges={['bottom', 'left', 'right']}
                style={style.container}
            >
                <StatusBar/>
                {component}
            </SafeAreaView>
        );
    }
}

const style = StyleSheet.create({
    container: {
        flex: 1,
    },
});
