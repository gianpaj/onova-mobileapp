// @flow

// forked from https://github.com/zubairpaizer/react-native-searchable-dropdown/commit/9c45f12543a4394c03f2ce928dd13f21b757b2d8

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Keyboard,
  ListView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });

export default class SearchableDropDown extends Component {
  static propTypes = {
    containerStyle: PropTypes.object,
    placeholder: PropTypes.string,
    placeholderTextColor: PropTypes.string,
    // textInputStyle,
    // underlineColorAndroid,
  };

  state = {
    item: {},
    items: [],
    focus: false,
  };

  renderList = () => {
    if (this.state.focus) {
      return (
        <ListView
          style={this.props.itemsContainerStyle}
          keyboardShouldPersistTaps="always"
          dataSource={ds.cloneWithRows(this.state.items)}
          renderRow={this.renderItems}
        />
      );
    }
  };

  componentDidMount() {
    const { items, defaultIndex } = this.props;
    if (defaultIndex && items.length > defaultIndex) {
      return this.setState({
        items,
        item: items[defaultIndex],
      });
    }
    this.setState({ items });
  }

  searchedItems = searchedText => {
    const { onTextChange, items } = this.props;
    const filteredItems = items.filter(
      item => item.name.toLowerCase().indexOf(searchedText.toLowerCase()) > -1
    );
    const item = {
      id: -1,
      name: searchedText,
    };
    this.setState({ listItems: filteredItems, item });

    if (onTextChange && typeof onTextChange === 'function') {
      setTimeout(() => {
        onTextChange(searchedText);
      }, 0);
    }
  };

  renderItems = item => (
    <TouchableOpacity
      style={this.props.itemStyle}
      onPress={() => {
        this.setState({ item, focus: false });
        Keyboard.dismiss();
        setTimeout(() => this.props.onItemSelect(item), 0);
      }}>
      <Text style={this.props.itemTextStyle}>{item.name}</Text>
    </TouchableOpacity>
  );

  _onBlur = () => this.setState({ focus: false });
  _onFocus = () =>
    this.setState({
      focus: true,
      item: {
        name: '',
        id: 0,
      },
      listItems: this.state.items,
    });

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
        <TextInput
          ref={e => (this.input = e)}
          onBlur={this._onBlur}
          onChangeText={this.searchedItems}
          onFocus={this._onFocus}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          // style={textInputStyle}
          underlineColorAndroid={underlineColorAndroid}
          value={this.state.item.name}
        />
        {this.renderList()}
      </View>
    );
  }
}
