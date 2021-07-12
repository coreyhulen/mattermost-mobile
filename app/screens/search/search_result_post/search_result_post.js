// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import Post from '@components/post_list/post';
import {SEARCH} from '@constants/screen';

export default class SearchResultPost extends PureComponent {
    static propTypes = {
        isDeleted: PropTypes.bool.isRequired,
        highlightPinnedOrFlagged: PropTypes.bool,
        postId: PropTypes.string.isRequired,
        skipFlaggedHeader: PropTypes.bool,
        skipPinnedHeader: PropTypes.bool,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        showFullDate: false,
    };

    render() {
        const postComponentProps = {theme: this.props.theme};

        if (this.props.isDeleted) {
            postComponentProps.shouldRenderReplyButton = false;
        } else {
            postComponentProps.shouldRenderReplyButton = true;
            postComponentProps.highlightPinnedOrFlagged = this.props.highlightPinnedOrFlagged;
            postComponentProps.skipFlaggedHeader = this.props.skipFlaggedHeader;
            postComponentProps.skipPinnedHeader = this.props.skipPinnedHeader;
        }

        return (
            <Post
                testID='search_result_post.post'
                postId={this.props.postId}
                {...postComponentProps}
                isSearchResult={true}
                showAddReaction={false}
                location={SEARCH}
            />
        );
    }
}
