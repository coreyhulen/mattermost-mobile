// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {Node, Parser} from 'commonmark';
import Renderer from 'commonmark-react-renderer';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Platform, Text, View} from 'react-native';

import Emoji from '@components/emoji';
import FormattedText from '@components/formatted_text';
import {blendColors, concatStyles, makeStyleSheetFromTheme} from '@utils/theme';

export default class MarkdownEmoji extends PureComponent {
    static propTypes = {
        baseTextStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        isEdited: PropTypes.bool,
        isJumboEmoji: PropTypes.bool.isRequired,
        theme: PropTypes.object.isRequired,
        value: PropTypes.string.isRequired,
    };

    constructor(props) {
        super(props);

        this.parser = this.createParser();
        this.renderer = this.createRenderer();
    }

    createParser = () => {
        return new Parser();
    }

    createRenderer = () => {
        return new Renderer({
            renderers: {
                editedIndicator: this.renderEditedIndicator,
                emoji: this.renderEmoji,
                paragraph: this.renderParagraph,
                document: this.renderParagraph,
                text: this.renderText,
            },
        });
    };

    computeTextStyle = (baseStyle) => {
        if (!this.props.isJumboEmoji) {
            return baseStyle;
        }

        const style = getStyleSheet(this.props.theme);

        return concatStyles(baseStyle, style.jumboEmoji);
    };

    renderEmoji = ({context, emojiName, literal}) => {
        return (
            <Emoji
                emojiName={emojiName}
                literal={literal}
                testID='markdown_emoji'
                textStyle={this.computeTextStyle(this.props.baseTextStyle, context)}
            />
        );
    };

    renderParagraph = ({children}) => {
        const style = getStyleSheet(this.props.theme);
        return (
            <View style={style.block}><Text>{children}</Text></View>
        );
    };

    renderText = ({context, literal}) => {
        const style = this.computeTextStyle(this.props.baseTextStyle, context);

        return <Text style={style}>{literal}</Text>;
    };

    renderEditedIndicator = ({context}) => {
        let spacer = '';
        if (context[0] === 'paragraph') {
            spacer = ' ';
        }

        const style = getStyleSheet(this.props.theme);
        const styles = [
            this.props.baseTextStyle,
            style.editedIndicatorText,
        ];

        return (
            <Text style={styles}>
                {spacer}
                <FormattedText
                    id='post_message_view.edited'
                    defaultMessage='(edited)'
                />
            </Text>
        );
    };

    render() {
        const ast = this.parser.parse(this.props.value);

        if (this.props.isEdited) {
            const editIndicatorNode = new Node('edited_indicator');
            if (ast.lastChild && ['heading', 'paragraph'].includes(ast.lastChild.type)) {
                ast.lastChild.appendChild(editIndicatorNode);
            } else {
                const node = new Node('paragraph');
                node.appendChild(editIndicatorNode);

                ast.appendChild(node);
            }
        }

        return this.renderer.render(ast);
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    // Android has trouble giving text transparency depending on how it's nested,
    // so we calculate the resulting colour manually
    const editedOpacity = Platform.select({
        ios: 0.3,
        android: 1.0,
    });
    const editedColor = Platform.select({
        ios: theme.centerChannelColor,
        android: blendColors(theme.centerChannelBg, theme.centerChannelColor, 0.3),
    });

    return {
        block: {
            alignItems: 'flex-start',
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        editedIndicatorText: {
            color: editedColor,
            opacity: editedOpacity,
        },
        jumboEmoji: {
            fontSize: 40,
            lineHeight: 50,
        },
    };
});
