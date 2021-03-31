// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Post} from '@support/ui/component';

class SearchResultPostScreen {
    testID = {
        searchResultPostItem: 'search_result_post.post',
    }

    getPost = (postId, postMessage, postProfileOptions = {}) => {
        const {
            postItem,
            postItemEmoji,
            postItemHeaderDateTime,
            postItemHeaderDisplayName,
            postItemHeaderGuestTag,
            postItemHeaderReply,
            postItemImage,
            postItemMessage,
            postItemProfilePicture,
            postItemProfilePictureUserStatus,
            postItemShowLessButton,
            postItemShowMoreButton,
        } = Post.getPost(this.testID.searchResultPostItem, postId, postMessage, postProfileOptions);

        return {
            searchResultPostItem: postItem,
            searchResultPostItemEmoji: postItemEmoji,
            searchResultPostItemHeaderDateTime: postItemHeaderDateTime,
            searchResultPostItemHeaderDisplayName: postItemHeaderDisplayName,
            searchResultPostItemHeaderGuestTag: postItemHeaderGuestTag,
            searchResultPostItemHeaderReply: postItemHeaderReply,
            searchResultPostItemImage: postItemImage,
            searchResultPostItemMessage: postItemMessage,
            searchResultPostItemProfilePicture: postItemProfilePicture,
            searchResultPostItemProfilePictureUserStatus: postItemProfilePictureUserStatus,
            searchResultPostItemShowLessButton: postItemShowLessButton,
            searchResultPostItemShowMoreButton: postItemShowMoreButton,
        };
    }

    getPostMessageAtIndex = (index) => {
        return Post.getPostMessage(this.testID.searchResultPostItem).atIndex(index);
    }
}

const searchResultPostScreen = new SearchResultPostScreen();
export default searchResultPostScreen;
