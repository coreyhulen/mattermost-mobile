/* eslint-disable  */
// Original work:  https://github.com/react-native-community/react-native-drawer-layout .
// Modified work: Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import React, { Component } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Keyboard,
    PanResponder,
    Platform,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    I18nManager,
} from 'react-native';
import PropTypes from 'prop-types';

const MIN_SWIPE_DISTANCE = 3;
const VX_MAX = 0.1;

const IDLE = 'Idle';
const DRAGGING = 'Dragging';
const SETTLING = 'Settling';
const emptyObject = {};

export default class DrawerLayout extends Component {
	public _panResponder: any;
	public canClose: any;
	public openValue: any;
	public state: any;
	public setState: any;
	public props: any;
	public _lastOpenValue: any;
	public _isClosing: any;
	public _closingAnchorValue: any;
	public drawerPosition: any;
	public accessibilityViewIsModal: any;
	public drawerShown: any;
	public drawerBackgroundColor: any;
	public drawerWidth: any;
	public width: any;
	public isTablet: any;
	public deviceWidth: any;
	public threshold: any;
    static propTypes = {
        children: PropTypes.any,
        drawerBackgroundColor: PropTypes.string,
        drawerLockMode: PropTypes.oneOf(['unlocked', 'locked-closed', 'locked-open']),
        drawerPosition: PropTypes.oneOf(['left', 'right']),
        drawerWidth: PropTypes.number,
        keyboardDismissMode: PropTypes.oneOf(['none', 'on-drag']),
        onDrawerClose: PropTypes.func,
        onDrawerOpen: PropTypes.func,
        onDrawerSlide: PropTypes.func,
        onDrawerStateChanged: PropTypes.func,
        renderNavigationView: PropTypes.func,
        statusBarBackgroundColor: PropTypes.string,
        useNativeAnimations: PropTypes.bool,
        isTablet: PropTypes.bool,
    }

    static defaultProps = {
        drawerWidth: 0,
        drawerPosition: 'left',
        useNativeAnimations: false,
        isTablet: false,
        renderNavigationView: () => true,
    };

    static positions = {
        Left: 'left',
        Right: 'right',
    };

    constructor(props, context) {
        super(props, context);

        this._panResponder = PanResponder.create({
            onMoveShouldSetPanResponder: this._shouldSetPanResponder,
            onPanResponderGrant: this._panResponderGrant,
            onPanResponderMove: this._panResponderMove,
            onPanResponderTerminationRequest: () => false,
            onPanResponderRelease: this._panResponderRelease,
            onPanResponderTerminate: () => {},
        });

        this.canClose = true;
        this.openValue = new Animated.Value(0);
        const deviceWidth = parseFloat(Dimensions.get('window').width);
        this.state = {
            accessibilityViewIsModal: false,
            deviceWidth,
            drawerShown: false,
            threshold: deviceWidth / 2,
        };
        this.openValue.addListener(this.handleOpenValueChanged);
    }

    componentDidMount() {
        Dimensions.addEventListener('change', this.handleDimensionsChange);
    }

    componentWillUnmount() {
        if (this.openValue) {
            this.openValue.removeListener(this.handleOpenValueChanged);
        }
        Dimensions.removeEventListener('change', this.handleDimensionsChange);
    }

    handleDimensionsChange = ({window}) => {
        const deviceWidth = parseFloat(window.width);
        this.setState({
            deviceWidth,
            threshold: deviceWidth / 2,
        });
    };

    handleOpenValueChanged = ({ value }) => {
        const drawerShown = value > 0;
        const accessibilityViewIsModal = drawerShown;

        if (drawerShown !== this.state.drawerShown) {
            this.setState({ drawerShown, accessibilityViewIsModal });
        }

        if (this.props.keyboardDismissMode === 'on-drag' || drawerShown) {
            Keyboard.dismiss();
        }

        this._lastOpenValue = value;
        if (this.props.onDrawerSlide) {
            this.props.onDrawerSlide({ nativeEvent: { offset: value } });
        }
    };

    getDrawerPosition() {
        const { drawerPosition } = this.props;
        const rtl = I18nManager.isRTL;
        return rtl
            ? drawerPosition === 'left' ? 'right' : 'left' // invert it
            : drawerPosition;
    }

    renderDrawer = () => {
        if (this.props.isTablet) {
            return null;
        }

        const { accessibilityViewIsModal, drawerShown } = this.state;

        const {
            drawerBackgroundColor,
            drawerWidth,
            drawerPosition,
        } = this.props;

        /**
         * We need to use the "original" drawer position here
         * as RTL turns position left and right on its own
         **/
        const dynamicDrawerStyles = {
            backgroundColor: drawerBackgroundColor,
            width: drawerWidth,
            left: drawerPosition === 'left' ? 0 : null,
            right: drawerPosition === 'right' ? 0 : null,
        };
        /* Drawer styles */
        let outputRange;
        let translateDistance = drawerWidth;
        if (Platform.OS === 'ios') {
            // ios main sidebar sits mostly under the main screen, with slight move
            translateDistance = drawerPosition === 'left' ?
            Math.floor(drawerWidth * 0.2) : Math.floor(drawerWidth * 1.2)
        }

        if (this.getDrawerPosition() === 'left') {
            outputRange = [-translateDistance, 0];
        } else {
            outputRange = [translateDistance, 0];
        }

        const drawerTranslateX = this.openValue.interpolate({
            inputRange: [0, 1],
            outputRange,
            extrapolate: 'clamp',
        });
        const animatedDrawerStyles = {
            transform: [{ translateX: drawerTranslateX }],
        };

        // 0 - ios main drawer
        // 1 - main | tablet
        // 2 - overlay
        // 3 - android main drawer | settings drawer
        const drawerZIndex = drawerPosition === 'left' ? 0 : 3

        return (
            <React.Fragment>
                <Animated.View
                    accessibilityViewIsModal={accessibilityViewIsModal}
                    style={[
                        StyleFactory.drawer(drawerZIndex),
                        dynamicDrawerStyles,
                        animatedDrawerStyles,
                    ]}
                >
                    {this.props.renderNavigationView(drawerWidth)}
                </Animated.View>
            </React.Fragment>
        );
    };

    renderDrawerForTablet = () => {
        const {accessibilityViewIsModal} = this.state;
        const {
            drawerWidth: width,
            isTablet,
        } = this.props;

        if (isTablet) {
            return (
                <Animated.View
                    accessibilityViewIsModal={accessibilityViewIsModal}
                    style={[styles.tablet, {width}]}
                >
                    {this.props.renderNavigationView(width)}
                </Animated.View>
            );
        }

        return null;
    };

    render() {
        const {drawerPosition, drawerWidth, isTablet} = this.props;
        const panHandlers = isTablet ? emptyObject : this._panResponder.panHandlers;
        const containerStyles = [styles.container];
        if (isTablet) {
            containerStyles.push(styles.tabletContainer);
        }

        const mainStyles = [styles.main]
        if (drawerPosition === 'left') {
            /* Drawer styles */
            let outputRange;
            
            if (this.getDrawerPosition() === 'left') {
                outputRange = [0, drawerWidth];
            } else {
                outputRange = [drawerWidth, 0];
            }
            
            const drawerTranslateX = this.openValue.interpolate({
                inputRange: [0, 1],
                outputRange,
                extrapolate: 'clamp',
            });

            const animatedDrawerStyles = {
                transform: [{ translateX: drawerTranslateX }],
            };
            mainStyles.push(animatedDrawerStyles)
        }

        /* Overlay styles */
        const overlayOpacity = this.openValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.5],
            extrapolate: 'clamp',
        });
        const animatedOverlayStyles = { opacity: overlayOpacity };
        const pointerEvents = this.state.drawerShown ? 'auto' : 'none';        

        return (
            <View
                testID={this.props.testID}
                style={containerStyles}
                {...panHandlers}
            >
                {this.renderDrawerForTablet()}
                <Animated.View style={mainStyles}>
                    <TouchableWithoutFeedback
                        pointerEvents={pointerEvents}
                        onPress={this._onOverlayClick}
                    >
                        <Animated.View
                            pointerEvents={pointerEvents}
                            style={[styles.overlay, animatedOverlayStyles]}
                        />
                    </TouchableWithoutFeedback>
                    {this.props.children}
                </Animated.View>
                {this.renderDrawer()}
            </View>
        );
    }

    _onOverlayClick = (e) => {
        e.stopPropagation();
        if (!this._isLockedClosed() && !this._isLockedOpen()) {
            this.closeDrawer();
        }
    };

    _emitStateChanged = (newState) => {
        if (this.props.onDrawerStateChanged) {
            this.props.onDrawerStateChanged(newState);
        }
    };

    openDrawer = (options = {}) => {
        if (!this.props.isTablet) {
            this._emitStateChanged(SETTLING);
            Animated.timing(this.openValue, {
                toValue: 1,
                duration: 150,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: this.props.useNativeAnimations,
                ...options,
            }).start(() => {
                this.handleOpenValueChanged({value: 1});
                if (this.props.onDrawerOpen) {

                    this.props.onDrawerOpen();
                }
                this._emitStateChanged(IDLE);
            });
        }
    };

    closeDrawer = (options = {}) => {
        this._emitStateChanged(SETTLING);
        Animated.timing(this.openValue, {
            toValue: 0,
            duration: 150,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: this.props.useNativeAnimations,
            ...options,
        }).start(() => {
            this.handleOpenValueChanged({value: 0});
            if (this.props.onDrawerClose) {
                this.props.onDrawerClose();
                this.canClose = true;
            }

            this._emitStateChanged(IDLE);
        });
    };

    _handleDrawerOpen = () => {
        if (this.props.onDrawerOpen) {
            this.props.onDrawerOpen();
        }
    };

    _handleDrawerClose = () => {
        if (this.props.onDrawerClose) {
            this.props.onDrawerClose();
        }
    };

    _shouldSetPanResponder = (e, { moveX, dx, dy }) => {
        if (!dx || !dy || Math.abs(dx) < MIN_SWIPE_DISTANCE) {
            return false;
        }

        if (this._isLockedClosed() || this._isLockedOpen() || !this.canClose) {
            return false;
        }

        const {deviceWidth} = this.state;
        const overlayArea = deviceWidth -
            (deviceWidth - this.props.drawerWidth);

        if (this.getDrawerPosition() === 'left') {
            if (this._lastOpenValue === 1) {
                if (
                    (dx < 0 && Math.abs(dx) > Math.abs(dy) * 3) ||
                    moveX > overlayArea
                ) {
                    this._isClosing = true;
                    this._closingAnchorValue = this._getOpenValueForX(moveX);
                    return true;
                }
            } else {
                const filter = moveX > 0 && dx > 35;
                if (filter) {
                    this._isClosing = false;
                    return true;
                }

                return false;
            }
        } else {
            if (this._lastOpenValue === 1) {
                if (
                    (dx > 0 && Math.abs(dx) > Math.abs(dy) * 3) ||
                    moveX < overlayArea
                ) {
                    this._isClosing = true;
                    this._closingAnchorValue = this._getOpenValueForX(moveX);
                    return true;
                }
            } else {
                if (moveX >= deviceWidth - 35 && dx < 0) {
                    this._isClosing = false;
                    return true;
                }

                return false;
            }
        }
    };

    _panResponderGrant = () => {
        this._emitStateChanged(DRAGGING);
    };

    _panResponderMove = (e, { moveX, dx }) => {
        const useDx = this.getDrawerPosition() === 'left' && !this._isClosing;
        let openValue = this._getOpenValueForX(useDx ? dx : moveX);

        if (this._isClosing) {
            openValue = 1 - (this._closingAnchorValue - openValue);
        }

        if (openValue > 1) {
            openValue = 1;
        } else if (openValue < 0) {
            openValue = 0;
        }

        this.openValue.setValue(openValue);
    };

    _panResponderRelease = (e, { moveX, vx }) => {
        const {threshold} = this.state;
        const previouslyOpen = this._isClosing;
        const isWithinVelocityThreshold = vx < VX_MAX && vx > -VX_MAX;

        if (this.getDrawerPosition() === 'left') {
            if (
                (vx > 0 && moveX > threshold) ||
                vx >= VX_MAX ||
                (isWithinVelocityThreshold &&
                    previouslyOpen &&
                    moveX > threshold)
            ) {
                this.openDrawer({ velocity: vx });
            } else if (
                (vx < 0 && moveX < threshold) ||
                vx < -VX_MAX ||
                (isWithinVelocityThreshold && !previouslyOpen)
            ) {
                this.closeDrawer({ velocity: vx });
            } else if (previouslyOpen) {
                this.openDrawer();
            } else {
                this.closeDrawer();
            }
        } else {
            if (
                (vx < 0 && moveX < threshold) ||
                vx <= -VX_MAX ||
                (isWithinVelocityThreshold &&
                    previouslyOpen &&
                    moveX < threshold)
            ) {
                this.openDrawer({ velocity: (-1) * vx });
            } else if (
                (vx > 0 && moveX > threshold) ||
                vx > VX_MAX ||
                (isWithinVelocityThreshold && !previouslyOpen)
            ) {
                this.closeDrawer({ velocity: (-1) * vx });
            } else if (previouslyOpen) {
                this.openDrawer();
            } else {
                this.closeDrawer();
            }
        }
    };

    _isLockedClosed = () => {
        return this.props.drawerLockMode === 'locked-closed' &&
            !this.state.drawerShown;
    };

    _isLockedOpen = () => {
        return this.props.drawerLockMode === 'locked-open' &&
            this.state.drawerShown;
    };

    _getOpenValueForX(x) {
        const { drawerWidth } = this.props;
        const { deviceWidth } = this.state;

        if (this.getDrawerPosition() === 'left') {
            return x / drawerWidth;
        }

        // position === 'right'
        return (deviceWidth - x) / drawerWidth;
    }
}

class StyleFactory {
    static drawer(zIndex) {
        return ({
            position: 'absolute',
            top: 0,
            bottom: 0,
            zIndex,
        });
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    tabletContainer: {
        flexDirection: 'row',
    },
    tablet: {
        height: '100%',
        zIndex: 1,
    },
    main: {
        flex: 1,
        zIndex: 1,
        position: 'relative', // so overlay pins to this View
    },
    overlay: {
        backgroundColor: '#000',
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        zIndex: 2,
    },
});
