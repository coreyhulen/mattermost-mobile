// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Animated, ImageBackground, Image, Platform, View, StyleSheet} from 'react-native';

import thumb from '@assets/images/thumb.png';
import RetriableFastImage from '@components/retriable_fast_image';
import {changeOpacity, makeStyleSheetFromTheme} from '@utils/theme';

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);
const AnimatedFastImage = Animated.createAnimatedComponent(RetriableFastImage);

export default class ProgressiveImage extends PureComponent {
    static propTypes = {
        id: PropTypes.string,
        isBackgroundImage: PropTypes.bool,
        children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf([PropTypes.node])]),
        defaultSource: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.number]), // this should be provided by the component
        imageUri: PropTypes.string,
        imageStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        inViewPort: PropTypes.bool,
        onError: PropTypes.func,
        resizeMethod: PropTypes.string,
        resizeMode: PropTypes.string,
        style: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        theme: PropTypes.object.isRequired,
        thumbnailUri: PropTypes.string,
        tintDefaultSource: PropTypes.bool,
    };

    static defaultProps = {
        style: {},
        defaultSource: undefined,
        resizeMode: 'contain',
    };

    constructor(props) {
        super(props);

        this.state = {
            intensity: new Animated.Value(0),
            showHighResImage: false,
        };
    }

    componentDidUpdate(prevProps) {
        if (prevProps.inViewPort !== this.props.inViewPort && this.props.inViewPort) {
            this.startLoadingOriginalImage();
        }
    }

    startLoadingOriginalImage = () => {
        this.setState({
            showHighResImage: true,
        });
    }

    onLoadImageEnd = () => {
        Animated.timing(this.state.intensity, {
            duration: 300,
            toValue: 100,
            useNativeDriver: true,
        }).start();
    }

    render() {
        const {
            defaultSource,
            id,
            imageStyle,
            imageUri,
            isBackgroundImage,
            onError,
            resizeMode,
            resizeMethod,
            style,
            theme,
            thumbnailUri,
            tintDefaultSource,
        } = this.props;

        const {showHighResImage} = this.state;

        let DefaultComponent;
        let ImageComponent;
        if (isBackgroundImage) {
            DefaultComponent = ImageBackground;
            ImageComponent = AnimatedImageBackground;
        } else {
            DefaultComponent = AnimatedFastImage;
            ImageComponent = AnimatedFastImage;
        }

        const styles = getStyleSheet(theme);

        if (isBackgroundImage) {
            return (
                <View style={[styles.defaultImageContainer, style]}>
                    <DefaultComponent
                        source={{uri: imageUri}}
                        resizeMode={'cover'}
                        style={[StyleSheet.absoluteFill, imageStyle]}
                    >
                        {this.props.children}
                    </DefaultComponent>
                </View>
            );
        }

        if (defaultSource) {
            return (
                <View style={[styles.defaultImageContainer, style]}>
                    <DefaultComponent
                        source={defaultSource}
                        style={[StyleSheet.absoluteFill, imageStyle, tintDefaultSource ? styles.defaultImageTint : null]}
                        resizeMode={resizeMode}
                        resizeMethod={resizeMethod}
                        onError={onError}
                        nativeID={`image-${id}`}
                    >
                        {this.props.children}
                    </DefaultComponent>
                </View>
            );
        }

        const opacity = this.state.intensity.interpolate({
            inputRange: [20, 100],
            outputRange: [0.2, 1],
        });
        const defaultOpacity = this.state.intensity.interpolate({
            inputRange: [0, 100],
            outputRange: [0.5, 0],
        });

        const containerStyle = {
            backgroundColor: changeOpacity(theme.centerChannelColor, defaultOpacity),
        };

        let thumbnail;
        let image;
        if (thumbnailUri) {
            const ImageElement = thumbnailUri.startsWith('data:') ? Image : ImageComponent;

            thumbnail = (
                <ImageElement
                    resizeMode={resizeMode}
                    resizeMethod={resizeMethod}
                    onError={onError}
                    source={{uri: thumbnailUri}}
                    style={[
                        StyleSheet.absoluteFill,
                        imageStyle,
                    ]}
                    blurRadius={Platform.OS === 'android' ? 0.4 : 1}
                    testID='progressive_image.miniPreview'
                >
                    {this.props.children}
                </ImageElement>
            );

            if (showHighResImage) {
                image = (
                    <ImageComponent
                        nativeID={`image-${id}`}
                        resizeMode={resizeMode}
                        resizeMethod={resizeMethod}
                        onError={onError}
                        source={{uri: imageUri}}
                        style={[
                            StyleSheet.absoluteFill,
                            imageStyle,
                            {opacity}]
                        }
                        testID='progressive_image.highResImage'
                        onLoadEnd={this.onLoadImageEnd}
                    >
                        {this.props.children}
                    </ImageComponent>
                );
            }
        } else {
            thumbnail = (
                <DefaultComponent
                    resizeMode={resizeMode}
                    resizeMethod={resizeMethod}
                    onError={onError}
                    source={thumb}
                    style={[imageStyle, {tintColor: theme.centerChannelColor, opacity: defaultOpacity}]}
                    testID='progressive_image.thumbnail'
                />
            );

            image = (
                <ImageComponent
                    nativeID={`image-${id}`}
                    resizeMode={resizeMode}
                    resizeMethod={resizeMethod}
                    onError={onError}
                    source={{uri: imageUri}}
                    style={[StyleSheet.absoluteFill, imageStyle, {opacity}]}
                    onLoadEnd={this.onLoadImageEnd}
                    testID='progressive_image.highResImage'
                >
                    {this.props.children}
                </ImageComponent>
            );
        }

        return (
            <Animated.View style={[styles.defaultImageContainer, style, containerStyle]}>
                {thumbnail}
                {image}
            </Animated.View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        defaultImageContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.08),
        },
        defaultImageTint: {
            flex: 1,
            tintColor: changeOpacity(theme.centerChannelColor, 0.2),
        },
    };
});
