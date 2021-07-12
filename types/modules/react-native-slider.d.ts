/* eslint-disable header/header */
declare module 'react-native-slider' {
    import {ComponentClass} from 'react';
    import {
        ImageSourcePropType,
        SpringAnimationConfig,
        StyleProp,
        TimingAnimationConfig,
        ViewStyle,
    } from 'react-native';

    interface SliderProps {

      /**
       * Initial value of the slider. The value should be between minimumValue
       * and maximumValue, which default to 0 and 1 respectively.
       * Default value is 0.
       *
       * *This is not a controlled component*, e.g. if you don't update
       * the value, the component won't be reset to its inital value.
       */
      value?: number;

      /**
       * If true the user won't be able to move the slider.
       * Default value is false.
       */
      disabled?: boolean;

      /**
       * Initial minimum value of the slider. Default value is 0.
       */
      minimumValue?: number;

      /**
       * Initial maximum value of the slider. Default value is 1.
       */
      maximumValue?: number;

      /**
       * Step value of the slider. The value should be between 0 and
       * (maximumValue - minimumValue). Default value is 0.
       */
      step?: number;

      /**
       * The color used for the track to the left of the button. Overrides the
       * default blue gradient image.
       */
      minimumTrackTintColor?: string;

      /**
       * The color used for the track to the right of the button. Overrides the
       * default blue gradient image.
       */
      maximumTrackTintColor?: string;

      /**
       * The color used for the thumb.
       */
      thumbTintColor?: string;

      /**
       * The size of the touch area that allows moving the thumb.
       * The touch area has the same center has the visible thumb.
       * This allows to have a visually small thumb while still allowing the user
       * to move it easily.
       * The default is {width: 40, height: 40}.
       */
      thumbTouchSize?: { width: number; height: number };

      /**
       * Callback continuously called while the user is dragging the slider.
       */
      onValueChange: (value: number) => void;

      /**
       * Callback called when the user starts changing the value (e.g. when
       * the slider is pressed).
       */
      onSlidingStart?: (value: number) => void;

      /**
       * Callback called when the user finishes changing the value (e.g. when
       * the slider is released).
       */
      onSlidingComplete?: (value: number) => void;

      /**
       * The style applied to the slider container.
       */
      style?: StyleProp<ViewStyle>;

      /**
       * The style applied to the track.
       */
      trackStyle?: StyleProp<ViewStyle>;

      /**
       * The style applied to the thumb.
       */
      thumbStyle?: StyleProp<ViewStyle>;

      /**
       * Sets an image for the thumb.
       */
      thumbImage?: ImageSourcePropType;

      /**
       * Set this to true to visually see the thumb touch rect in green.
       */
      debugTouchArea?: boolean;

      /**
       * Set to true to animate values with default 'timing' animation type
       */
      animateTransitions?: boolean;

      /**
       * Custom Animation type. 'spring' or 'timing'.
       */
      animationType?: 'spring' | 'timing';

      /**
       * Used to configure the animation parameters.  These are the same parameters in the Animated library.
       */
      animationConfig?: SpringAnimationConfig | TimingAnimationConfig;
    }

    const Slider: ComponentClass<SliderProps>;

    export default Slider;
  }
