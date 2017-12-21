import { StackNavigator } from 'react-navigation';
import { Login, Signup, Product } from '../screens';
import { Tabs } from './navigationTabs';

const navigator = StackNavigator(
  {
    login: { screen: Login },
    signup: { screen: Signup },
    product: { screen: Product },
    tabs: { screen: Tabs },
  },
  {
    headerMode: 'none',
  }
);

export default navigator;
