// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { StyleSheet, Text, View } from 'react-native';
import { Button as NBButton, Content } from 'native-base';
import { SearchBar } from 'react-native-elements';
import { withNavigation } from 'react-navigation';
import { APP_NAME } from 'react-native-dotenv';

import type { NavigationScreenProp } from 'react-navigation';

import I18n from '../i18n';
import RadioForm, { RadioButton, RadioButtonInput, RadioButtonLabel } from '../components/SimpleRadioButton';
import colors from '../config/colors';
import settings from '../config/settings';
import { category_radio_grp_1, category_radio_grp_2, category_radio_grp_3 } from '../utils/ui';

type Props = {
  navigation: NavigationScreenProp<*>,
};

type State = {
  isLoading: boolean,
  text: string,
  grp_1: number,
};

class SearchByHashtagsTabContainer extends Component<Props, State> {
  search: { current: any };
  constructor(props: Props) {
    super(props);
    this.search = React.createRef();
  }

  state = {
    isLoading: false,
    text: '',
    grp_1: -1,
  };

  onSearch = () => {
    if (!this.isSearchEnabled()) return;

    const { text, grp_1 } = this.state;

    this.search.current.blur();

    // this.setState({ isLoading: true });
    // TODO: check verify tags/items exists
    // this.setState({ isLoading: false });

    this.props.navigation.navigate({
      routeName: 'searchProductsResults',
      params: {
        tag: text.trim(),
        grp_1,
      },
      key: 'searchProductsResults',
    });
  };

  onChangeText = (text: string) => this.setState({ text });

  isSearchEnabled(): boolean {
    // if the hash tag is not empty needs have a mininum length

    // OR

    const { text, grp_1 } = this.state;

    // it can be empty and either category or type
    return (
      (text.trim().length && text.trim().length >= settings.MIN_LENGTH_PER_TAG) || (!text.length && grp_1 !== -1)
      // isLoading == false
    );
  }

  setCategory = (grp_1: number) => {
    if (this.state.isLoading) return;

    // if the same category is pressed
    if (this.state.grp_1 === grp_1) grp_1 = -1;

    this.setState({ grp_1 });
  };

  renderCategories() {
    const { grp_1 } = this.state;
    if (APP_NAME == 'onova') {
      return (
        <View style={styles.grps}>
          <RadioForm animation formHorizontal>
            {category_radio_grp_1.map((option, i) => (
              <RadioButton labelHorizontal={false} key={i}>
                <RadioButtonLabel
                  index={i}
                  labelStyle={styles.radioButtonLabel}
                  obj={option}
                  onPress={this.setCategory}
                />
                <RadioButtonInput
                  {...RadioButtonInputProps}
                  index={i}
                  isSelected={grp_1 === option.value}
                  obj={option}
                  onPress={this.setCategory}
                />
              </RadioButton>
            ))}
          </RadioForm>
        </View>
      );
    }
    return (
      <>
        <View style={styles.grps}>
          <RadioForm animation formHorizontal>
            {category_radio_grp_1
              .filter((_, i) => i < 2)
              .map((option, i) => (
                <RadioButton labelHorizontal={false} key={i}>
                  <RadioButtonLabel
                    index={i}
                    labelStyle={styles.radioButtonLabel}
                    obj={option}
                    onPress={this.setCategory}
                  />
                  <RadioButtonInput
                    {...RadioButtonInputProps}
                    index={i}
                    isSelected={grp_1 === option.value}
                    obj={option}
                    onPress={this.setCategory}
                  />
                </RadioButton>
              ))}
          </RadioForm>
        </View>

        <View style={styles.grps}>
          <RadioForm animation formHorizontal>
            {category_radio_grp_1
              .filter((_, i) => i > 1 && i < 4)
              .map((option, i) => (
                <RadioButton labelHorizontal={false} key={i}>
                  <RadioButtonLabel
                    obj={option}
                    index={i}
                    onPress={this.setCategory}
                    labelStyle={styles.radioButtonLabel}
                  />
                  <RadioButtonInput
                    {...RadioButtonInputProps}
                    index={i}
                    isSelected={grp_1 === option.value}
                    obj={option}
                    onPress={this.setCategory}
                  />
                </RadioButton>
              ))}
          </RadioForm>
        </View>
        <View style={styles.grps}>
          <RadioForm animation formHorizontal>
            {category_radio_grp_1
              .filter((_, i) => i > 3)
              .map((option, i) => (
                <RadioButton labelHorizontal={false} key={i}>
                  <RadioButtonLabel
                    obj={option}
                    index={i}
                    onPress={this.setCategory}
                    labelStyle={styles.radioButtonLabel}
                  />
                  <RadioButtonInput
                    {...RadioButtonInputProps}
                    index={i}
                    isSelected={grp_1 === option.value}
                    obj={option}
                    onPress={this.setCategory}
                  />
                </RadioButton>
              ))}
          </RadioForm>
        </View>
      </>
    );
  }

  render() {
    const { isLoading, text } = this.state;

    return (
      <Content style={styles.flex1}>
        <>
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
              value={text}
            />
          </View>
          {this.renderCategories()}
        </>
        <View
          style={[
            styles.padder,
            {
              alignSelf: 'center',
              marginVertical: 30,
              width: 280,
            },
          ]}>
          <NBButton block dark={this.isSearchEnabled()} disabled={!this.isSearchEnabled()} onPress={this.onSearch}>
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
  grps: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  padder: {
    padding: 10,
  },
  radioButtonInput: {
    marginBottom: 15,
    width: APP_NAME == 'drop' ? 162 : 90,
  },
  radioButtonLabel: {
    color: colors.grey1,
    flex: 1,
    marginBottom: 10,
    paddingLeft: 0,
    textAlign: 'center',
  },
});

const RadioButtonInputProps = {
  borderWidth: 2,
  buttonInnerColor: colors.black,
  buttonOuterColor: colors.black,
  buttonOuterSize: 19,
  buttonSize: 19,
  buttonWrapStyle: styles.radioButtonInput,
};

export const SearchByHashtagsTab = withNavigation(connect(null)(SearchByHashtagsTabContainer));
