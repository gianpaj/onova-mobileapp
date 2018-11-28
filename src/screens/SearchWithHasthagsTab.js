// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, Text, View } from 'react-native';
import { Button as NBButton, Content } from 'native-base';
import { SearchBar } from 'react-native-elements';
import RadioForm, {
  RadioButton,
  RadioButtonInput,
  RadioButtonLabel,
} from 'react-native-simple-radio-button';
import { withNavigation } from 'react-navigation';

import type { NavigationScreenProp } from 'react-navigation';

import I18n from '../i18n';
import colors from '../config/colors';
import settings from '../config/settings';
import { category_radio_grp_1, category_radio_grp_2 } from '../utils/ui';

import type { ReduxState } from '../types';

type Props = {
  focused: boolean,
  navigation: NavigationScreenProp<*>,
};

type State = {
  isLoading: boolean,
  text: string,
  grp_1: number,
  grp_2: number,
};

class SearchWithHasthagsTabContainer extends Component<Props, State> {
  search;
  constructor(props: Props) {
    super(props);
    this.search = React.createRef();
  }

  state = {
    isLoading: false,
    text: '',
    grp_1: -1,
    grp_2: -1,
  };

  componentDidMount() {
    this.search.current.focus();
  }

  componentDidUpdate() {
    this.props.focused && this.search.current.focus();
  }

  onSearch = () => {
    if (!this.isSearchEnabled()) return;

    const { text, grp_1, grp_2 } = this.state;

    this.search.current.blur();

    // this.setState({ isLoading: true });
    // TODO: check verify tags/items exists
    // this.setState({ isLoading: false });

    this.props.navigation.navigate({
      routeName: 'searchProductsResults',
      params: {
        tag: text,
        grp_1,
        grp_2,
      },
      key: `searchProductsResults`,
    });
  };

  onChangeText = (text: string) => this.setState({ text: text.trim() });

  isSearchEnabled(): boolean {
    // if the hash tag is not empty needs have a mininum length

    // OR

    // it can be empty and either category or type
    return (
      (this.state.text.length &&
        this.state.text.length >= settings.MIN_LENGTH_PER_TAG) ||
      (!this.state.text.length &&
        (this.state.grp_1 !== -1 || this.state.grp_2 !== -1))
      // this.state.isLoading == false
    );
  }

  setCategories = (grp_1: number) => {
    if (!this.state.isLoading) {
      if (this.state.grp_1 == grp_1) {
        return this.setState({ grp_1: -1 });
      }
      this.setState({ grp_1 });
    }
  };

  setTypes = (grp_2: number) => {
    if (!this.state.isLoading) {
      if (this.state.grp_2 == grp_2) {
        return this.setState({ grp_2: -1 });
      }
      this.setState({ grp_2 });
    }
  };

  render() {
    const { isLoading } = this.state;

    return (
      <Content style={styles.flex1}>
        <View>
          <View
            style={{
              alignSelf: 'center',
              marginVertical: 30,
              width: 280,
            }}>
            <SearchBar
              ref={this.search}
              autoCapitalize="none"
              autoCorrect={false}
              blurOnSubmit={false}
              clearButtonMode="while-editing" // iOS
              containerStyle={{
                backgroundColor: colors.white,
                borderTopWidth: 0,
                borderBottomWidth: 0,
              }}
              // enablesReturnKeyAutomatically // iOS
              icon={{ type: 'feather', name: 'hash', color: colors.grey1 }}
              inputStyle={{
                backgroundColor: colors.white,
                color: this.isSearchEnabled() ? colors.black : colors.red,
              }}
              lightTheme
              maxLength={50}
              onChangeText={this.onChangeText}
              onSubmitEditing={this.onSearch}
              placeholder={I18n.t('search.hashtag_placeholder')}
              placeholderTextColor={colors.grey1}
              returnKeyType="search"
              showLoadingIcon={isLoading}
              underlineColorAndroid={colors.black}
              value={this.state.text}
            />
          </View>
          <View style={styles.grps}>
            <RadioForm animation formHorizontal>
              {category_radio_grp_1.map((option, i) => (
                <RadioButton labelHorizontal={false} key={i}>
                  <RadioButtonLabel
                    labelHorizontal
                    obj={option}
                    index={i}
                    onPress={this.setCategories}
                    labelStyle={styles.radioButtonLabel}
                  />
                  <RadioButtonInput
                    obj={option}
                    index={i}
                    isSelected={this.state.grp_1 == i}
                    onPress={this.setCategories}
                    borderWidth={2}
                    buttonInnerColor={colors.black}
                    buttonOuterColor={colors.black}
                    buttonSize={19}
                    buttonOuterSize={19}
                    buttonWrapStyle={styles.radioButtonInput}
                  />
                </RadioButton>
              ))}
            </RadioForm>
          </View>
          <View style={styles.grps}>
            <RadioForm animation formHorizontal>
              {category_radio_grp_2.map((option, i) => (
                <RadioButton labelHorizontal={false} key={i}>
                  <RadioButtonLabel
                    labelHorizontal
                    obj={option}
                    index={i}
                    onPress={this.setTypes}
                    labelStyle={styles.radioButtonLabel}
                  />
                  <RadioButtonInput
                    obj={option}
                    index={i}
                    isSelected={this.state.grp_2 == i}
                    onPress={this.setTypes}
                    borderWidth={2}
                    buttonInnerColor={colors.black}
                    buttonOuterColor={colors.black}
                    buttonSize={19}
                    buttonOuterSize={19}
                    buttonWrapStyle={styles.radioButtonInput}
                  />
                </RadioButton>
              ))}
            </RadioForm>
          </View>
        </View>
        <View
          style={[
            styles.padder,
            {
              alignSelf: 'center',
              marginVertical: 30,
              width: 280,
            },
          ]}>
          <NBButton
            block
            dark={this.isSearchEnabled()}
            disabled={!this.isSearchEnabled()}
            onPress={this.onSearch}>
            <Text
              // eslint-disable-next-line
              style={{
                fontSize: 16,
                color: colors.white,
              }}>
              {I18n.t('search.search_button')}
            </Text>
          </NBButton>
        </View>
      </Content>
    );
  }
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  padder: {
    padding: 10,
  },
  grps: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  radioButtonLabel: {
    color: colors.grey1,
    marginBottom: 10,
    paddingLeft: 0,
    textAlign: 'center',
    width: 75,
  },
  radioButtonInput: {
    width: 75,
    marginBottom: 15,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
});

export const SearchWithHasthagsTab = withNavigation(
  connect(mapStateToProps)(SearchWithHasthagsTabContainer)
);
