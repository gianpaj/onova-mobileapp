// @flow

// taken from https://github.com/jwohlfert23/react-native-tag-input/blob/9440e5b2bcb9e4923f52ff2045102b44544d087a/index.js

import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewPropTypes,
} from 'react-native';
import invariant from 'invariant';

import type { ViewStyleProp } from 'react-native/Libraries/StyleSheet/StyleSheet';

const windowWidth = Dimensions.get('window').width;

type KeyboardShouldPersistTapsProps = 'always' | 'never' | 'handled' | false | true;
type RequiredProps<T> = {
  /**
   * An array of tags, which can be any type, as long as labelExtractor below
   * can extract a string from it
   */
  value: $ReadOnlyArray<T>,
  /**
   * A handler to be called when array of tags change. The parent should update
   * the value prop when this is called if they want to enable removal of tags
   */
  onChange: (items: Array<T>) => void,
  /**
   * Function to extract string value for label from item
   */
  labelExtractor: (tagData: T) => string,
  /**
   * The text currently being displayed in the TextInput following the list of
   * tags
   */
  text: string,
  /**
   * This callback gets called when the user types in the TextInput. The parent
   * should update the text prop when this is called if they want to enable
   * input. This is also where any parsing to detect new tags should occur
   */
  onChangeText: (text: string) => void,
};
type OptionalProps = {
  /**
   * If false, text input is not editable and existing tags cannot be removed.
   */
  editable: boolean,

  onBlur: () => void,
  /**
   * Background color of tags
   */
  tagColor: string,
  /**
   * Text color of tags
   */
  tagTextColor: string,
  /**
   * Styling override for container surrounding tag text
   */
  tagContainerStyle?: ViewStyleProp,
  /**
   * Styling override for tag's text component
   */
  tagTextStyle?: ViewStyleProp,
  /**
   * Width override for text input's default width when it's empty and showing placeholder
   */
  inputDefaultWidth: number,
  /**
   * Color of text input
   */
  inputColor: string,
  /**
   * Any misc. TextInput props (autoFocus, placeholder, returnKeyType, etc.)
   */
  inputProps?: $PropertyType<TextInput, 'props'>,
  /**
   * Max height of the tag input on screen (will scroll if max height reached)
   */
  maxHeight: number,
  /**
   * Callback that gets passed the new component height when it changes
   */
  onHeightChange?: (height: number) => void,
  /**
   * Any ScrollView props (horizontal, showsHorizontalScrollIndicator, etc.)
   */
  scrollViewProps?: $PropertyType<ScrollView, 'props'>,
};
type Props<T> = RequiredProps<T> & OptionalProps;
type State = {
  inputWidth: number,
  wrapperHeight: number,
};

class TagInput<T> extends React.PureComponent<Props<T>, State> {
  static propTypes = {
    editable: PropTypes.bool,
    inputColor: PropTypes.string,
    inputDefaultWidth: PropTypes.number,
    labelExtractor: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    onChange: PropTypes.func.isRequired,
    onChangeText: PropTypes.func.isRequired,
    tagColor: PropTypes.string,
    tagContainerStyle: ViewPropTypes.style,
    tagTextColor: PropTypes.string,
    tagTextStyle: Text.propTypes.style,
    text: PropTypes.string.isRequired,
    value: PropTypes.array.isRequired,
    inputProps: PropTypes.shape(TextInput.propTypes),
    maxHeight: PropTypes.number,
    onHeightChange: PropTypes.func,
    scrollViewProps: PropTypes.shape(ScrollView.propTypes),
  };
  props: Props<T>;
  state: State;
  wrapperWidth = windowWidth;
  spaceLeft = 0;
  // scroll to bottom
  contentHeight = 0;
  // refs
  tagInput: ?TextInput = null;
  scrollView: ?ScrollView = null;

  static defaultProps = {
    editable: true,
    tagColor: '#dddddd',
    tagTextColor: '#777777',
    inputDefaultWidth: 90,
    inputColor: '#777777',
    maxHeight: 75,
  };

  static inputWidth(text: string, spaceLeft: number, inputDefaultWidth: number, wrapperWidth: number) {
    if (text === '') {
      return inputDefaultWidth;
    }
    if (spaceLeft >= 100) {
      return spaceLeft - 10;
    }
    return wrapperWidth;
  }

  constructor(props: Props<T>) {
    super(props);
    this.state = {
      inputWidth: props.inputDefaultWidth,
      wrapperHeight: 36,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props<T>) {
    const inputWidth = TagInput.inputWidth(
      nextProps.text,
      this.spaceLeft,
      nextProps.inputDefaultWidth,
      this.wrapperWidth
    );
    if (inputWidth !== this.state.inputWidth) {
      this.setState({ inputWidth });
    }
    const wrapperHeight = Math.min(nextProps.maxHeight, this.contentHeight);
    if (wrapperHeight !== this.state.wrapperHeight) {
      this.setState({ wrapperHeight });
    }
  }

  componentDidUpdate(nextProps: Props<T>, nextState: State) {
    if (this.props.onHeightChange && nextState.wrapperHeight !== this.state.wrapperHeight) {
      this.props.onHeightChange(nextState.wrapperHeight);
    }
  }

  measureWrapper = (event: { nativeEvent: { layout: { width: number } } }) => {
    this.wrapperWidth = event.nativeEvent.layout.width;
    const inputWidth = TagInput.inputWidth(
      this.props.text,
      this.spaceLeft,
      this.props.inputDefaultWidth,
      this.wrapperWidth
    );
    if (inputWidth !== this.state.inputWidth) {
      this.setState({ inputWidth });
    }
  };

  onKeyPress = (event: { nativeEvent: { key: string } }) => {
    if (this.props.text !== '' || event.nativeEvent.key !== 'Backspace') {
      return;
    }
    const tags = [...this.props.value];
    tags.pop();
    this.props.onChange(tags);
    this.scrollToEnd();
    this.focus();
  };

  focus = () => {
    invariant(this.tagInput, 'should be set');
    this.tagInput.focus();
  };

  removeIndex = (index: number) => {
    const tags = [...this.props.value];
    tags.splice(index, 1);
    this.props.onChange(tags);
  };

  scrollToEnd = () => {
    const scrollView = this.scrollView;
    invariant(scrollView, 'this.scrollView ref should exist before scrollToEnd called');
    setTimeout(() => {
      scrollView.scrollToEnd({ animated: true });
    }, 0);
  };

  render() {
    const {
      editable,
      inputColor,
      inputProps,
      labelExtractor,
      onBlur,
      onChangeText,
      scrollViewProps,
      tagColor,
      tagContainerStyle,
      tagTextColor,
      tagTextStyle,
      text,
      value,
    } = this.props;

    const tags = value.map((tag, index) => (
      <Tag
        editable={editable}
        index={index}
        isLastTag={value.length === index + 1}
        key={index}
        label={labelExtractor(tag)}
        onLayoutLastTag={this.onLayoutLastTag}
        removeIndex={this.removeIndex}
        tagColor={tagColor}
        tagContainerStyle={tagContainerStyle}
        tagTextColor={tagTextColor}
        tagTextStyle={tagTextStyle}
      />
    ));

    return (
      <TouchableWithoutFeedback onPress={this.focus} style={styles.container} onLayout={this.measureWrapper}>
        <View style={[styles.wrapper, { height: this.state.wrapperHeight }]}>
          <ScrollView
            ref={this.scrollViewRef}
            style={styles.tagInputContainerScroll}
            onContentSizeChange={this.onScrollViewContentSizeChange}
            keyboardShouldPersistTaps={('handled': KeyboardShouldPersistTapsProps)}
            {...scrollViewProps}>
            <View style={styles.tagInputContainer}>
              {tags}
              <View style={[styles.textInputContainer, { width: this.state.inputWidth }]}>
                <TextInput
                  ref={this.tagInputRef}
                  blurOnSubmit={false}
                  onKeyPress={this.onKeyPress}
                  value={text}
                  style={[
                    styles.textInput,
                    {
                      width: this.state.inputWidth,
                      color: inputColor,
                    },
                  ]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={editable}
                  keyboardType="default"
                  onBlur={onBlur}
                  onChangeText={onChangeText}
                  placeholder="Start typing"
                  returnKeyType="done"
                  underlineColorAndroid="rgba(0,0,0,0)"
                  {...inputProps}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  tagInputRef = (tagInput: ?React.ElementRef<typeof TextInput>) => {
    invariant(typeof tagInput === 'object', 'TextInput ref is object');
    this.tagInput = tagInput;
  };

  scrollViewRef = (scrollView: ?React.ElementRef<typeof ScrollView>) => {
    invariant(typeof scrollView === 'object', 'ScrollView ref is object');
    this.scrollView = scrollView;
  };

  onScrollViewContentSizeChange = (w: number, h: number) => {
    if (this.contentHeight === h) return;

    const nextWrapperHeight = Math.min(this.props.maxHeight, h);
    if (nextWrapperHeight !== this.state.wrapperHeight) {
      this.setState({ wrapperHeight: nextWrapperHeight }, this.contentHeight < h ? this.scrollToEnd : undefined);
    } else if (this.contentHeight < h) {
      this.scrollToEnd();
    }
    this.contentHeight = h;
  };

  onLayoutLastTag = (endPosOfTag: number) => {
    const margin = 3;
    this.spaceLeft = this.wrapperWidth - endPosOfTag - margin - 30;
    const inputWidth = TagInput.inputWidth(
      this.props.text,
      this.spaceLeft,
      this.props.inputDefaultWidth,
      this.wrapperWidth
    );
    if (inputWidth !== this.state.inputWidth) {
      this.setState({ inputWidth });
    }
  };
}

type TagProps = {
  editable: boolean,
  index: number,
  isLastTag: boolean,
  label: string,
  onLayoutLastTag: (endPosOfTag: number) => void,
  removeIndex: (index: number) => void,
  tagColor: string,
  tagContainerStyle?: ViewStyleProp,
  tagTextColor: string,
  tagTextStyle?: ViewStyleProp,
};
class Tag extends React.PureComponent<TagProps> {
  props: TagProps;
  static propTypes = {
    editable: PropTypes.bool.isRequired,
    index: PropTypes.number.isRequired,
    isLastTag: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
    onLayoutLastTag: PropTypes.func.isRequired,
    removeIndex: PropTypes.func.isRequired,
    tagColor: PropTypes.string.isRequired,
    tagContainerStyle: ViewPropTypes.style,
    tagTextColor: PropTypes.string.isRequired,
    tagTextStyle: Text.propTypes.style,
  };
  curPos: ?number = null;

  UNSAFE_componentWillReceiveProps(nextProps: TagProps) {
    if (!this.props.isLastTag && nextProps.isLastTag && this.curPos !== null && this.curPos !== undefined) {
      this.props.onLayoutLastTag(this.curPos);
    }
  }

  render() {
    const { editable, label, tagColor, tagContainerStyle, tagTextColor, tagTextStyle } = this.props;

    return (
      <TouchableOpacity
        disabled={!editable}
        onPress={this.onPress}
        onLayout={this.onLayoutLastTag}
        style={[styles.tag, { backgroundColor: tagColor }, tagContainerStyle]}>
        <Text style={[styles.tagText, { color: tagTextColor }, tagTextStyle]}>
          {label}
          &nbsp;&times;
        </Text>
      </TouchableOpacity>
    );
  }

  onPress = () => this.props.removeIndex(this.props.index);

  onLayoutLastTag = event => {
    const { layout } = event.nativeEvent;
    this.curPos = layout.width + layout.x;
    if (this.props.isLastTag) {
      this.props.onLayoutLastTag(this.curPos);
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tag: {
    borderRadius: 2,
    height: 28,
    justifyContent: 'center',
    marginRight: 3,
    marginTop: 3,
    padding: Platform.select({
      android: 8,
      ios: 4,
    }),
    paddingLeft: 8,
  },
  tagInputContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagInputContainerScroll: {
    flex: 1,
  },
  tagText: {
    fontSize: Platform.select({
      android: 18,
      ios: 15,
    }),
  },
  textInput: {
    flex: 0.6,
    fontSize: 18,
    height: 60,
    marginBottom: 6,
    textAlignVertical: 'center',
  },
  textInputContainer: {
    height: 60,
    marginTop: 2,
  },
  wrapper: {
    alignItems: 'flex-start',
    flex: 1,
    flexDirection: 'row',
    marginBottom: 2,
    marginTop: 3,
    marginHorizontal: 20,
  },
});

export default TagInput;
