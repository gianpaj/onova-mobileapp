'use strict';

import React, { Component, PureComponent } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

class RadioForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isActiveIndex: props.initial,
    };
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    this._renderButton = this._renderButton.bind(this);
  }
  static defaultProps = {
    animation: true,
    buttonColor: '#2196f3',
    disabled: false,
    formHorizontal: false,
    initial: 0,
    labelColor: '#000',
    labelHorizontal: true,
    radio_props: [],
    selectedButtonColor: '#2196f3',
    selectedLabelColor: '#000',
    wrapStyle: {},
  };

  updateIsActiveIndex(index) {
    this.setState({ isActiveIndex: index });
    this.props.onPress(this.props.radio_props[index], index);
  }

  _renderButton(obj, i) {
    const { isActiveIndex } = this.state;
    const {
      accessibilityLabel,
      buttonColor,
      labelColor,
      onPress,
      radioStyle,
      selectedButtonColor,
      selectedLabelColor,
      testID,
    } = this.props;

    const buttonIsActive = isActiveIndex === i;
    return (
      <RadioButton
        {...this.props}
        accessibilityLabel={accessibilityLabel ? accessibilityLabel + '|' + i : 'radioButton' + '|' + i}
        buttonColor={buttonIsActive ? selectedButtonColor : buttonColor}
        index={i}
        isSelected={buttonIsActive}
        key={i}
        labelColor={buttonIsActive ? selectedLabelColor : labelColor}
        obj={obj}
        onPress={(value, index) => {
          onPress(value, index);
          this.setState({ isActiveIndex: index });
        }}
        style={radioStyle}
        testID={testID ? testID + '|' + i : 'radioButton' + '|' + i}
      />
    );
  }

  render() {
    let renderContent;
    if (this.props.radio_props.length) {
      renderContent = this.props.radio_props.map(this._renderButton);
    } else {
      renderContent = this.props.children;
    }
    return (
      <View style={[Style.radioFrom, this.props.style, this.props.formHorizontal && Style.formHorizontal]}>
        {renderContent}
      </View>
    );
  }
}

class RadioButton extends PureComponent {
  static defaultProps = {
    buttonColor: '#2196f3',
    disabled: false,
    idSeparator: '|',
    isSelected: false,
    labelHorizontal: true,
    selectedButtonColor: '#2196f3',
  };

  componentWillUpdate() {
    if (this.props.animation) LayoutAnimation.spring();
  }

  render() {
    const { children } = this.props;

    const idSeparator = this.props.idSeparator ? this.props.idSeparator : '|';
    const idSeparatorAccessibilityLabelIndex = this.props.accessibilityLabel
      ? this.props.accessibilityLabel.indexOf(idSeparator)
      : -1;
    const idSeparatorTestIdIndex = this.props.testID ? this.props.testID.indexOf(idSeparator) : -1;

    const accessibilityLabel = this.props.accessibilityLabel
      ? idSeparatorAccessibilityLabelIndex !== -1
        ? this.props.accessibilityLabel.substring(0, idSeparatorAccessibilityLabelIndex)
        : this.props.accessibilityLabel
      : 'radioButton';
    const testID = this.props.testID
      ? idSeparatorTestIdIndex !== -1
        ? this.props.testID.substring(0, idSeparatorTestIdIndex)
        : this.props.testID
      : 'radioButton';

    const accessibilityLabelIndex =
      this.props.accessibilityLabel && idSeparatorAccessibilityLabelIndex !== -1
        ? this.props.accessibilityLabel.substring(idSeparatorAccessibilityLabelIndex + 1)
        : '';
    let testIDIndex = this.props.testID && testIDIndex !== -1 ? this.props.testID.split(testIDIndex + 1) : '';

    const wrapStyle = [Style.radioWrap, !this.props.labelHorizontal && Style.labelVerticalWrap, this.props.style];
    let renderContent = false;
    renderContent = children ? (
      <View style={wrapStyle}>{children}</View>
    ) : (
      <View style={wrapStyle}>
        <RadioButtonInput
          {...this.props}
          accessibilityLabel={accessibilityLabel + 'Input' + accessibilityLabelIndex}
          testID={testID + 'Input' + testIDIndex}
        />
        <RadioButtonLabel
          {...this.props}
          accessibilityLabel={accessibilityLabel + 'Label' + accessibilityLabelIndex}
          testID={testID + 'Label' + testIDIndex}
        />
      </View>
    );
    return <View style={this.props.wrapStyle}>{renderContent}</View>;
  }
}

function RadioButtonInput(props) {
  const innerSize = { width: 20, height: 20, borderRadius: 20 / 2 };
  const outerSize = {
    width: 20 + 10,
    height: 20 + 10,
    borderRadius: (20 + 10) / 2,
  };
  if (props.buttonSize) {
    const { buttonSize } = props;
    innerSize.width = buttonSize;
    innerSize.height = buttonSize;
    innerSize.borderRadius = buttonSize / 2;
    outerSize.width = buttonSize + 10;
    outerSize.height = buttonSize + 10;
    outerSize.borderRadius = (buttonSize + 10) / 2;
  }
  if (props.buttonOuterSize) {
    const { buttonOuterSize } = props;
    outerSize.width = buttonOuterSize;
    outerSize.height = buttonOuterSize;
    outerSize.borderRadius = buttonOuterSize / 2;
  }
  let outerColor = props.buttonOuterColor;
  const borderWidth = props.borderWidth || 3;
  let innerColor = props.buttonInnerColor;
  if (props.buttonColor) {
    outerColor = props.buttonColor;
    innerColor = props.buttonColor;
  }
  const c = (
    <View
      style={[
        Style.radioNormal,
        props.isSelected && Style.radioActive,
        props.isSelected && innerSize,
        props.isSelected && { backgroundColor: innerColor },
      ]}
    />
  );
  const radioStyle = [
    Style.radio,
    {
      borderColor: outerColor,
      borderWidth,
    },
    props.buttonStyle,
    outerSize,
  ];

  if (props.disabled) {
    return (
      <View style={props.buttonWrapStyle}>
        <View style={radioStyle}>{c}</View>
      </View>
    );
  }

  return (
    <View style={props.buttonWrapStyle}>
      <TouchableOpacity
        accessible={props.accessible}
        accessibilityLabel={props.accessibilityLabel}
        testID={props.testID}
        style={radioStyle}
        onPress={() => props.onPress(props.obj.value, props.index)}>
        {c}
      </TouchableOpacity>
    </View>
  );
}

RadioButtonInput.defaultProps = {
  buttonInnerColor: '#2196f3',
  buttonOuterColor: '#2196f3',
  disabled: false,
};

function RadioButtonLabel(props) {
  return (
    <TouchableWithoutFeedback
      accessible={props.accessible}
      accessibilityLabel={props.accessibilityLabel}
      testID={props.testID}
      onPress={() => {
        if (!props.disabled) {
          props.onPress(props.obj.value, props.index);
        }
      }}>
      <View style={[props.labelWrapStyle, Style.labelWrapStyle]}>
        <Text
          style={[
            Style.radioLabel,
            !props.labelHorizontal && Style.labelVertical,
            { color: props.labelColor },
            props.labelStyle,
          ]}>
          {props.obj.label}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const Style = StyleSheet.create({
  radioWrap: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  radio: {
    justifyContent: 'center',
    alignItems: 'center',

    width: 30,
    height: 30,

    alignSelf: 'center',

    borderColor: '#2196f3',
    borderRadius: 30,
  },

  radioLabel: {
    paddingLeft: 10,
    lineHeight: 20,
  },

  radioNormal: {
    borderRadius: 10,
  },

  radioActive: {
    width: 20,
    height: 20,
    backgroundColor: '#2196f3',
  },

  labelWrapStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },

  labelVerticalWrap: {
    flexDirection: 'column',
    // paddingLeft: 10,
  },

  labelVertical: {
    paddingLeft: 0,
  },

  formHorizontal: {
    flexDirection: 'row',
  },
});

export default RadioForm;
export { RadioButton, RadioButtonInput, RadioButtonLabel };
