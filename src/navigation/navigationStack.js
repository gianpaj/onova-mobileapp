import { StackNavigator } from 'react-navigation';
import { AddProduct, Login, Signup, Product } from '../screens';
import { TabsStack } from './navigationTabs';

const navigator = StackNavigator(
  {
    login: { screen: Login },
    signup: {
      screen: Signup,
      navigationOptions: { gesturesEnabled: false },
    },
    product: {
      screen: Product,
      navigationOptions: { gesturesEnabled: false },
    },
    tabs: { screen: TabsStack },
    addProduct: { screen: AddProduct },
  },
  {
    headerMode: 'none',
  }
);

export default navigator;
