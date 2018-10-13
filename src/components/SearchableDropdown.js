// @flow

// forked from https://github.com/zubairpaizer/react-native-searchable-dropdown/commit/9c45f12543a4394c03f2ce928dd13f21b757b2d8

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Keyboard,
  FlatList,
  Text,
  // TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { InputItem } from 'antd-mobile-rn';

const cyrillic = /[\u0400-\u04FF]+/;
const LIMIT_BY = 20;

const emptyItem = { uk: '', id: '' };

export default class SearchableDropDown extends Component {
  static propTypes = {
    containerStyle: PropTypes.object,
    items: PropTypes.array.isRequired,
    // itemsContainerStyle: PropTypes.object,
    itemStyle: PropTypes.object,
    itemTextStyle: PropTypes.object,
    onFocus: PropTypes.func,
    onItemSelect: PropTypes.func,
    onTextChange: PropTypes.func,
    placeholder: PropTypes.string,
    placeholderTextColor: PropTypes.string,
    textInputStyle: PropTypes.object,
    underlineColorAndroid: PropTypes.string,
    value: PropTypes.shape({
      uk: PropTypes.string,
      id: PropTypes.string,
    }),
  };

  state = {
    item: {},
    items: [],
    focus: false,
  };

  _keyExtractor = item => item.id;

  renderList = () => {
    if (this.state.focus) {
      return (
        <FlatList
          // style={this.props.itemsContainerStyle}
          keyboardShouldPersistTaps="always"
          data={this.state.items}
          keyExtractor={this._keyExtractor}
          renderItem={this.renderItems}
        />
      );
    }
  };

  componentDidMount() {
    const { items, value } = this.props;
    if (value) {
      this.setState({ item: value });
    }
    this.setState({ items: items.slice(0, LIMIT_BY) });
  }

  onChangeText = searchedText => {
    const { onTextChange, items, onItemSelect } = this.props;
    if (!searchedText) {
      onItemSelect(emptyItem);
      // reset when field is cleared
      return this.setState({
        item: emptyItem,
        items: items.slice(0, LIMIT_BY),
      });
      // only allow cyrillic characters
    } else if (!cyrillic.test(searchedText)) return;

    const regex = new RegExp(`^${searchedText.trim()}`, 'i');
    const filteredItems = items.filter(city => regex.test(city.uk));
    filteredItems.sort((a, b) => a > b);
    this.setState({ items: filteredItems.slice(0, LIMIT_BY), item: emptyItem });

    if (onTextChange) {
      setTimeout(() => {
        onTextChange(searchedText);
      }, 0);
    }
  };

  renderItems = ({ item }) => (
    <TouchableOpacity
      style={this.props.itemStyle}
      onPress={() => {
        this.setState({ item, focus: false });
        Keyboard.dismiss();
        setTimeout(() => this.props.onItemSelect(item), 0);
      }}>
      <Text style={this.props.itemTextStyle}>{item.uk}</Text>
    </TouchableOpacity>
  );

  _onBlur = () => this.setState({ focus: false });
  _onFocus = () => {
    this.setState({ focus: true });
    this.props.onFocus();
  };

  render() {
    const {
      containerStyle,
      placeholder,
      placeholderTextColor,
      textInputStyle,
      underlineColorAndroid,
    } = this.props;

    return (
      <View keyboardShouldpersist="always" style={containerStyle}>
        <InputItem
          autoCorrect={false}
          clearButtonMode="while-editing"
          ref={e => (this.input = e)}
          onBlur={this._onBlur}
          onChangeText={this.onChangeText}
          onFocus={this._onFocus}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          style={textInputStyle}
          underlineColorAndroid={underlineColorAndroid}
          value={this.state.item.uk}
        />
        {this.renderList()}
      </View>
    );
  }
}
