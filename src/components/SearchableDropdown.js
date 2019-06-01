// @flow

// forked from https://github.com/zubairpaizer/react-native-searchable-dropdown/commit/9c45f12543a4394c03f2ce928dd13f21b757b2d8

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Keyboard, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { InputItem } from 'antd-mobile-rn';

import type { Node } from 'react';

const LIMIT_BY = 20;

const emptyItem = { uk: '', id: '' };

type Item = { uk: string, id: string };

type State = {
  currentVal: Item,
  items: Array<Item>,
  focus: boolean,
};

export default class SearchableDropDown extends Component<*, State> {
  input: Node;

  static propTypes = {
    containerStyle: PropTypes.object,
    disabled: PropTypes.bool,
    error: PropTypes.bool,
    extra: PropTypes.node,
    inputContainerStyle: PropTypes.object,
    items: PropTypes.array,
    itemsContainerStyle: PropTypes.object,
    itemStyle: PropTypes.object,
    itemTextStyle: PropTypes.object,
    onFocus: PropTypes.func,
    onItemSelect: PropTypes.func.isRequired,
    onSubmitEditing: PropTypes.func,
    // onTextChange: PropTypes.func,
    placeholder: PropTypes.string,
    placeholderTextColor: PropTypes.string,
    returnKeyType: PropTypes.string,
    // e.g. only allow cyrillic characters
    refProp: PropTypes.func.isRequired,
    regexToMatch: PropTypes.instanceOf(RegExp),
    value: PropTypes.shape({
      uk: PropTypes.string,
      id: PropTypes.string,
    }), // FIXME: .isRequired,
  };

  static defaultValue = {
    value: emptyItem,
  };

  state = {
    // item: {},
    currentVal: emptyItem,
    items: [],
    focus: false,
  };

  _keyExtractor = item => item.id;

  renderList = () => {
    const { items, focus } = this.state;
    if (!focus || !items.length) return;
    return (
      <FlatList
        data={items}
        keyboardShouldPersistTaps="always"
        keyExtractor={this._keyExtractor}
        renderItem={this.renderItems}
        style={this.props.itemsContainerStyle}
        // ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };

  componentDidMount() {
    const { items } = this.props;

    if (items) this.setState({ items: items.slice(0, LIMIT_BY) });
  }

  onChangeText = (searchedText: string) => {
    const { disabled, items, onItemSelect, regexToMatch } = this.props;
    if (disabled) return;
    if (!searchedText) {
      setTimeout(() => {
        onItemSelect(emptyItem);
      }, 0);
      // reset when field is cleared
      return this.setState({
        currentVal: emptyItem,
        items: items.slice(0, LIMIT_BY),
      });
      // e.g. only allow cyrillic characters
    } else if (regexToMatch && !regexToMatch.test(searchedText)) {
      // console.warn('no regexToMatch');
      return;
    }
    // https://stackoverflow.com/a/3561711/728287
    const cleanText = searchedText.trim().replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(cleanText, 'i');
    const filteredItems = items.filter(item => regex.test(item.uk));
    // filteredItems.sort((a, b) => a > b);
    const idResult = items.find(i => i.uk == searchedText);
    this.setState({
      currentVal: { uk: searchedText, id: idResult || -1 }, // cleanText?
      items: filteredItems.slice(0, LIMIT_BY),
    });

    // if (onTextChange) {
    //   // setTimeout(() => {
    //   //   onTextChange(searchedText);
    //   // }, 0);
    // }
  };

  // FIXME: do not render the component again if there are no changes
  static getDerivedStateFromProps(props: *, state: State) {
    if (!props.items) return null;
    // if it's not focused, reset
    if (!state.focus && props.items.length !== state.items.length) {
      return {
        items: props.items.slice(0, LIMIT_BY),
      };
    }

    // Return null to indicate no change to state.
    return null;
  }

  renderItems = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={this.props.itemStyle}
      onPress={() => {
        this.setState({ focus: false });
        this.setState({ currentVal: item });
        Keyboard.dismiss();
        this.props.onItemSelect(item);
      }}>
      <Text style={this.props.itemTextStyle}>{item.uk}</Text>
    </TouchableOpacity>
  );

  _onBlur = () => {
    const { value } = this.props;
    const { currentVal } = this.state;

    if (currentVal.uk && value && currentVal.uk !== value.uk) this.props.onItemSelect(currentVal);
    this.setState({ focus: false });
  };

  _onFocus = () => {
    const { value } = this.props;
    const { currentVal } = this.state;

    if (!currentVal.uk && value) this.setState({ currentVal: value });

    this.setState({ focus: true });
    this.props.onFocus();
  };

  render() {
    const {
      containerStyle,
      disabled,
      error,
      extra,
      inputContainerStyle,
      onSubmitEditing,
      placeholder,
      placeholderTextColor,
      refProp,
      returnKeyType,
      value,
    } = this.props;

    return (
      <View style={containerStyle}>
        <InputItem
          ref={e => {
            this.input = e;
            refProp(e);
          }}
          editable={!disabled}
          autoCorrect={false}
          clearButtonMode="while-editing"
          extra={extra}
          onBlur={this._onBlur}
          onChangeText={this.onChangeText}
          onFocus={this._onFocus}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={inputContainerStyle}
          value={this.state.focus ? this.state.currentVal.uk : value && value.uk}
          error={error}
        />
        {this.renderList()}
      </View>
    );
  }
}
