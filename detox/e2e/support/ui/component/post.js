// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import ProfilePicture from './profile_picture';

class Post {
    testID = {
        postProfilePicturePrefix: 'post_profile_picture.profile_picture.',
        emoji: 'markdown_emoji',
        image: 'markdown_image',
        message: 'markdown_text',
        postHeaderDateTime: 'post_header.date_time',
        postHeaderDisplayName: 'post_header.display_name',
        postHeaderGuestTag: 'post_header.guest_tag',
        postHeaderReply: 'post_header.reply',
        postPreHeaderText: 'post_pre_header.text',
        showLessButton: 'show_more.button.minus',
        showMoreButton: 'show_more.button.plus',
    }

    getPost = (postItemSourceTestID, postId, postMessage, postProfileOptions = {}) => {
        const postItemMatcher = this.getPostItemMatcher(postItemSourceTestID, postId, postMessage);
        const postItemEmojiMatcher = by.id(this.testID.emoji).withAncestor(postItemMatcher);
        const postItemImageMatcher = by.id(this.testID.image).withAncestor(postItemMatcher);
        const postItemMessageMatcher = by.id(this.testID.message).withAncestor(postItemMatcher);
        const postItemPreHeaderTextMatch = by.id(this.testID.postPreHeaderText).withAncestor(postItemMatcher);
        const postItemShowLessButtonMatcher = by.id(this.testID.showLessButton).withAncestor(postItemMatcher);
        const postItemShowMoreButtonMatcher = by.id(this.testID.showMoreButton).withAncestor(postItemMatcher);

        return {
            postItem: element(postItemMatcher),
            postItemEmoji: element(postItemEmojiMatcher),
            postItemImage: element(postItemImageMatcher),
            postItemMessage: element(postItemMessageMatcher),
            postItemPreHeaderText: element(postItemPreHeaderTextMatch),
            postItemShowLessButton: element(postItemShowLessButtonMatcher),
            postItemShowMoreButton: element(postItemShowMoreButtonMatcher),
            ...this.getPostHeader(postItemMatcher),
            ...this.getPostProfilePicture(postItemMatcher, postProfileOptions),
        };
    }

    getPostHeader = (postItemMatcher) => {
        const postItemHeaderDateTimeMatcher = by.id(this.testID.postHeaderDateTime).withAncestor(postItemMatcher);
        const postItemHeaderDisplayNameMatcher = by.id(this.testID.postHeaderDisplayName).withAncestor(postItemMatcher);
        const postItemHeaderGuestTagMatcher = by.id(this.testID.postHeaderGuestTag).withAncestor(postItemMatcher);
        const postItemHeaderReplyMatcher = by.id(this.testID.postHeaderReply).withAncestor(postItemMatcher);

        return {
            postItemHeaderDateTime: element(postItemHeaderDateTimeMatcher),
            postItemHeaderDisplayName: element(postItemHeaderDisplayNameMatcher),
            postItemHeaderGuestTag: element(postItemHeaderGuestTagMatcher),
            postItemHeaderReply: element(postItemHeaderReplyMatcher),
        };
    }

    getPostItemMatcher = (postItemSourceTestID, postId, postMessage) => {
        const postTestID = `${postItemSourceTestID}.${postId}`;
        const baseMatcher = by.id(postTestID);
        return postMessage ? baseMatcher.withDescendant(by.text(postMessage)) : baseMatcher;
    }

    getPostMessage = (postItemSourceTestID) => {
        return element(by.id(this.testID.message).withAncestor(by.id(postItemSourceTestID)));
    }

    getPostProfilePicture = (postItemMatcher, postProfileOptions = {userId: null, userStatus: 'online'}) => {
        if (Object.keys(postProfileOptions).length === 0 || !postProfileOptions.userId) {
            return {
                postItemProfilePicture: null,
                postItemProfilePictureUserStatus: null,
            };
        }

        const profilePictureItemMatcher = ProfilePicture.getProfilePictureItemMatcher(this.testID.postProfilePicturePrefix, postProfileOptions.userId);
        const profilePictureItemUserStatusMatcher = ProfilePicture.getProfilePictureItemUserStatusMatcher(profilePictureItemMatcher, postProfileOptions.userStatus);
        const postItemProfilePictureMatcher = profilePictureItemMatcher.withAncestor(postItemMatcher);
        const postItemProfilePictureUserStatusMatcher = profilePictureItemUserStatusMatcher.withAncestor(postItemMatcher);

        return {
            postItemProfilePicture: element(postItemProfilePictureMatcher),
            postItemProfilePictureUserStatus: element(postItemProfilePictureUserStatusMatcher),
        };
    }
}

const post = new Post();
export default post;
