// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {createElement, isValidElement} from 'react';
import {StyleProp, Text, TextProps, TextStyle, ViewStyle} from 'react-native';
import {useIntl} from 'react-intl';

type FormattedTextProps = TextProps & {
    id: string;
    defaultMessage: string;
    values?: Record<string, any>;
    testID?: string;
    style?: StyleProp<ViewStyle> | StyleProp<TextStyle>;
}

const FormattedText = (props: FormattedTextProps) => {
    const intl = useIntl();
    const {formatMessage} = intl;
    const {id, defaultMessage, values, ...otherProps} = props;
    const tokenizedValues: Record<string, any> = {};
    const elements: Record<string, any> = {};
    let tokenDelimiter = '';

    if (values && Object.keys(values).length > 0) {
        // Creates a token with a random UID that should not be guessable or
        // conflict with other parts of the `message` string.
        const uid = Math.floor(Math.random() * 0x10000000000).toString(16);

        const generateToken = (() => {
            let counter = 0;
            return () => {
                const elementId = `ELEMENT-${uid}-${(counter += 1)}`;
                return elementId;
            };
        })();

        // Splitting with a delimiter to support IE8. When using a regex
        // with a capture group IE8 does not include the capture group in
        // the resulting array.
        tokenDelimiter = `@__${uid}__@`;

        // Iterates over the `props` to keep track of any React Element
        // values so they can be represented by the `token` as a placeholder
        // when the `message` is formatted. This allows the formatted
        // message to then be broken-up into parts with references to the
        // React Elements inserted back in.
        Object.keys(values).forEach((name) => {
            const value = values[name];

            if (isValidElement(value)) {
                const token = generateToken();
                tokenizedValues[name] = tokenDelimiter + token + tokenDelimiter;
                elements[token] = value;
            } else {
                tokenizedValues[name] = value;
            }
        });
    }

    const descriptor = {id, defaultMessage};
    const formattedMessage = formatMessage(
        descriptor,
        tokenizedValues || values,
    );
    const hasElements = elements && Object.keys(elements).length > 0;

    let nodes;
    if (hasElements) {
        // Split the message into parts so the React Element values captured
        // above can be inserted back into the rendered message. This
        // approach allows messages to render with React Elements while
        // keeping React's virtual diffing working properly.
        nodes = formattedMessage.
            split(tokenDelimiter).
            filter((part) => Boolean(part)).
            map((part) => elements[part] || part);
    } else {
        nodes = [formattedMessage];
    }

    return createElement(Text, otherProps, ...nodes);
};

FormattedText.defaultProps = {
    defaultMessage: '',
};

export default FormattedText;
