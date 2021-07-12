// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {isAndroid, timeouts, wait} from '@support/utils';

import Alert from './alert';

class PostOptions {
    testID = {
        reactionButtonPrefix: 'reaction_picker.reaction_button.',
        postOptions: 'post.options',
        reactionPickerAction: 'post.options.reaction_picker.action',
        replyAction: 'post.options.reply.action',
        permalinkAction: 'post.options.permalink.action',
        copyAction: 'post.options.copy.action',
        deleteAction: 'post.options.delete.action',
        editAction: 'post.options.edit.action',
        saveAction: 'post.options.flagged.action',
        unsaveAction: 'post.options.unflag.action',
        pinAction: 'post.options.pin.action',
        unpinAction: 'post.options.unpin.action',
        markUnreadAction: 'post.options.markUnread.action',
        openAddReactionButton: 'open.add_reaction.button',
        slideUpPanel: 'slide_up_panel',
    }

    postOptions = element(by.id(this.testID.postOptions));
    reactionPickerAction = element(by.id(this.testID.reactionPickerAction));
    replyAction = element(by.id(this.testID.replyAction));
    permalinkAction = element(by.id(this.testID.permalinkAction));
    copyAction = element(by.id(this.testID.copyAction));
    deleteAction = element(by.id(this.testID.deleteAction));
    editAction = element(by.id(this.testID.editAction));
    saveAction = element(by.id(this.testID.saveAction));
    unsaveAction = element(by.id(this.testID.unsaveAction));
    pinAction = element(by.id(this.testID.pinAction));
    unpinAction = element(by.id(this.testID.unpinAction));
    markUnreadAction = element(by.id(this.testID.markUnreadAction));
    openAddReactionButton = element(by.id(this.testID.openAddReactionButton));
    slideUpPanel = element(by.id(this.testID.slideUpPanel));

    getReactionButton = (emojiName) => {
        return element(by.id(`${this.testID.reactionButtonPrefix}${emojiName}`));
    }

    toBeVisible = async () => {
        await expect(this.postOptions).toExist();

        return postOptions;
    }

    close = async () => {
        await this.postOptions.tap({x: 5, y: 10});
        await expect(this.postOptions).not.toBeVisible();
    }

    deletePost = async ({confirm = true} = {}) => {
        // # Swipe up panel on Android
        if (isAndroid()) {
            await this.slideUpPanel.swipe('up');
        }

        await this.deleteAction.tap();
        const {
            deletePostTitle,
            cancelButton,
            deleteButton,
        } = Alert;
        await expect(deletePostTitle).toBeVisible();
        await expect(cancelButton).toBeVisible();
        await expect(deleteButton).toBeVisible();
        if (confirm) {
            deleteButton.tap();
            await wait(timeouts.ONE_SEC);
            await expect(this.postOptions).not.toBeVisible();
        } else {
            cancelButton.tap();
            await wait(timeouts.ONE_SEC);
            await expect(this.postOptions).toBeVisible();
            await this.close();
        }
    }
}

const postOptions = new PostOptions();
export default postOptions;
