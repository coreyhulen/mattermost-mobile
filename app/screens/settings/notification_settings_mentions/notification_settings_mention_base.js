// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import {PureComponent} from 'react';
import {intlShape} from 'react-intl';
import {Navigation} from 'react-native-navigation';

import {getNotificationProps} from '@utils/notify_props';

export default class NotificationSettingsMentionsBase extends PureComponent {
    static propTypes = {
        currentUser: PropTypes.object.isRequired,
        intl: intlShape.isRequired,
        onBack: PropTypes.func.isRequired,
        theme: PropTypes.object.isRequired,
    };

    static defaultProps = {
        currentUser: {},
    };

    constructor(props) {
        super(props);

        const {currentUser} = props;
        const notifyProps = getNotificationProps(currentUser);

        this.goingBack = true; // use to identify if the navigator is popping this screen
        this.state = this.setStateFromNotifyProps(notifyProps);
    }

    componentDidMount() {
        this.navigationEventListener = Navigation.events().bindComponent(this);
    }

    componentDidDisappear() {
        if (this.goingBack) {
            this.saveUserNotifyProps();
        }
    }

    setStateFromNotifyProps = (notifyProps) => {
        const mentionKeys = (notifyProps.mention_keys || '').split(',');
        const usernameMentionIndex = mentionKeys.indexOf(this.props.currentUser.username);
        if (usernameMentionIndex > -1) {
            mentionKeys.splice(usernameMentionIndex, 1);
        }

        const comments = notifyProps.comments || 'any';
        const mentionKeysString = mentionKeys.join(',');

        const newState = {
            ...notifyProps,
            comments,
            newReplyValue: comments,
            usernameMention: usernameMentionIndex > -1,
            mention_keys: mentionKeysString,
            androidKeywords: mentionKeysString,
            showKeywordsModal: false,
            showReplyModal: false,
        };

        return newState;
    };

    toggleFirstNameMention = () => {
        this.setState({
            first_name: (!(this.state.first_name === 'true')).toString(),
        });
    };

    toggleUsernameMention = () => {
        this.setState({
            usernameMention: !this.state.usernameMention,
        });
    };

    toggleChannelMentions = () => {
        this.setState({
            channel: (!(this.state.channel === 'true')).toString(),
        });
    };

    updateMentionKeys = (text) => {
        this.goingBack = true;
        this.setState({
            mention_keys: text,
            showKeywordsModal: false,
        });
    };

    setReplyNotifications = (value) => {
        this.setState({
            comments: value,
            showReplyModal: false,
        });
    };

    saveUserNotifyProps = () => {
        let {mention_keys: mentionKeys, usernameMention, ...notifyProps} = this.state; //eslint-disable-line prefer-const

        if (mentionKeys.length > 0) {
            mentionKeys = mentionKeys.split(',').map((m) => m.replace(/\s/g, ''));
        } else {
            mentionKeys = [];
        }

        if (usernameMention) {
            mentionKeys.push(`${this.props.currentUser.username}`);
        }

        mentionKeys = mentionKeys.join(',');

        this.props.onBack({
            ...notifyProps,
            mention_keys: mentionKeys,
            user_id: this.props.currentUser.id,
        });
    };
}
