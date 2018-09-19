// @flow

import React from 'react';
import { connect } from 'react-redux';
import {
  Dimensions,
  StyleSheet,
  FlatList,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DatePicker, List, LocaleProvider, Toast } from 'antd-mobile-rn';
import {
  Body,
  Button as NBButton,
  Container,
  Content,
  Left,
  Right,
  Title,
} from 'native-base';

import colors from '../config/colors';
import { Header } from '../components';
import imagePickerStyle from '../components/ImagePicker.styles';
import I18n from '../i18n';

import type { Dispatch, UserData, ReduxState, Product } from '../types';

import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  dispatch: Dispatch,
  navigation?: NavigationScreenProp<*>,
  userData: UserData,
  token: string,
};

type State = {
  datetime: Date,
  products: Array<Product>,
  pending: boolean,
};

const { width } = Dimensions.get('window');
// const MIN_DATE = new Date(
//   new Date().setMinutes(Math.ceil(new Date().getMinutes() / 5) * 5)
// );
const INC_MONTH = 1;
const MAX_DATE = new Date(
  new Date().setMonth(new Date().getMonth() + INC_MONTH)
);

const locale = {
  locale: 'en',
  DatePicker: {
    okText: I18n.t('create_drop.ok'),
    dismissText: I18n.t('create_drop.cancel'),
    extra: I18n.t('create_drop.select'),
    DatePickerLocale: {
      year: '',
      month: '',
      day: '',
      hour: '',
      minute: '',
    },
  },
};

export class CreateDropScreen extends React.Component<Props, State> {
  state = {
    datetime: null,
    products: [],
    pending: false,
  };

  closeModal() {
    this.props.navigation.goBack();
  }

  onSendDrop = () => {
    Toast.loading(I18n.t('add_or_edit_item.toast_uploading'), 30);
    this.setState({ pending: true });
  };

  setDate = (datetime: Date) => this.setState({ datetime });

  onNewItem = () => {
    // $FlowFixMe
    this.props.navigation.navigate({
      routeName: 'addOrEditProduct',
      // params: {},
      key: 'addOrEditProduct',
    });
  };

  _keyExtractor = (item): string => item.key;

  render() {
    let { products, datetime } = this.state;

    if (products.length < 9) {
      const emptyToAdd = 9 - products.length;
      let emptyProducts = [];
      for (let i = 0; i < emptyToAdd; i++) {
        emptyProducts.push({ uploaded: false, key: products.length + i });
      }
      products = [...products, ...emptyProducts];
    }

    return (
      <Container>
        <Header>
          <Left style={styles.container}>
            <NBButton transparent onPress={this.closeModal}>
              <Icon name="close" size={28} />
            </NBButton>
          </Left>
          <Body style={styles.container}>
            <Title style={{ color: colors.black }}>
              {I18n.t('create_drop.title')}
            </Title>
          </Body>
          <Right>
            <NBButton
              testID="saveButton"
              transparent
              // disabled={!this.isButtonEnabled()}
              style={{ backgroundColor: colors.transparent }}
              onPress={this.onSendDrop}>
              <Icon
                name="check"
                // style={!this.isButtonEnabled() && { color: colors.grey4 }}
                size={28}
              />
            </NBButton>
          </Right>
        </Header>
        <View>
          <List>
            <LocaleProvider locale={locale}>
              <DatePicker
                value={datetime}
                mode="datetime"
                minDate={new Date()}
                maxDate={MAX_DATE}
                onChange={this.setDate}
                // minuteStep={5}
              >
                <List.Item arrow="horizontal">
                  {I18n.t('create_drop.select_datetime')}
                </List.Item>
              </DatePicker>
            </LocaleProvider>
          </List>
        </View>
        <Content>
          <FlatList
            columnWrapperStyle={[styles.columnWrapper]}
            data={products}
            numColumns={3}
            renderItem={({ item: product }) => (
              <View style={styles.row} key={product.key}>
                {product.uploaded ? (
                  <View>
                    {/* <Image
                      source={{ uri: data.url.replace('.jpg', '-thumb.jpg') }}
                      style={[styles.size, styles.image]}
                    />
                    <TouchableOpacity
                      // onPress={removeImage}
                      style={styles.closeWrap}
                      activeOpacity={0.6}>
                      <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity> */}
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={this.onNewItem}
                    style={[
                      imagePickerStyle.item,
                      styles.size,
                      imagePickerStyle.plusWrap,
                      imagePickerStyle.plusWrapNormal,
                    ]}>
                    <Text style={imagePickerStyle.plusText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            style={styles.list}
          />
        </Content>
      </Container>
    );
  }
}

const MARGIN = 1;

const styles = StyleSheet.create({
  // imageContainer: {
  //   borderColor: colors.grey3,
  //   borderWidth: 3 / PixelRatio.get(),
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // image: {
  //   width: width / 6,
  //   height: width / 6,
  // },
  closeWrap: {
    width: 16,
    height: 16,
    backgroundColor: colors.grey3,
    borderRadius: 8,
    position: 'absolute',
    top: 4 + 5,
    right: 4 + 5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  container: {
    alignItems: 'stretch',
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 4,
  },
  columnWrapper: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: -MARGIN * 2,
    marginBottom: 0,
  },
  list: {
    flex: 1,
    marginTop: -1,
  },
  size: {
    width: width / 3 - 20,
    height: width / 3 - 20,
    margin: 10,
  },
});

const mapStateToProps: any = (state: ReduxState) => ({
  userData: state.LoginReducer.data,
  token: state.LoginReducer.token,
});

export const CreateDrop = connect(mapStateToProps)(CreateDropScreen);
