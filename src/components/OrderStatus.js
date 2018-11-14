// @flow

import React, { PureComponent } from 'react';
import { Steps, WingBlank } from 'antd-mobile-rn';

import { StyleSheet, View } from 'react-native';

import { differenceInHours, format } from 'date-fns';

import colors from '../config/colors';
import * as ui from '../utils/ui';
import i18n from '../i18n';

import type { Order } from '../types';

type Props = {
  order: Order,
  style: any,
};

const Step = Steps.Step;

function formatDate(time) {
  if (differenceInHours(new Date(), time) < 24) {
    return format(time, 'D MMM HH:mm');
  }
  return format(time, 'D MMM');
}

class OrderStatus extends PureComponent<Props> {
  generateSteps(order: Order): Array<any> | null {
    // 1
    // order.status = 'confirmed';

    // 2
    // order.status = 'shipped';
    // order.dateShipped = new Date();

    // 2.1
    // order.status = 'delivered';
    // order.dateDelivered = new Date();

    // 3
    // order.status = 'completed';
    // order.finalisedAt = new Date();

    // order.status = 'failed_by_buyer';
    // order.finalisedAt = new Date();

    // order.status = 'failed_by_seller';
    // order.finalisedAt = new Date();

    if (order.status == 'pending' || order.status == 'paid') {
      return null;
    }

    const steps = [
      {
        title: i18n.t('order_status.confirmed'),
        description: formatDate(order.datePaid),
        status: 'finish',
      },
    ];

    const shipped = {
      title: i18n.t('order_status.shipped'),
      description: `${formatDate(order.dateShipped)} (updated)`,
      status: 'finish',
    };
    if (order.status == 'confirmed') {
      steps.push({
        title: i18n.t('order_status.not_shipped'),
        status: 'wait',
      });
    } else if (order.status == 'shipped') {
      steps.push(shipped);
      steps.push({
        title: i18n.t('order_status.not_collected'),
        status: 'wait',
      });
    } else if (order.status == 'delivered') {
      steps.push(shipped);
      steps.push({
        title: i18n.t('order_status.not_collected'),
        description: formatDate(order.dateDelivered),
        status: 'wait',
      });
    } else if (order.status == 'completed') {
      steps.push(shipped);
      steps.push({
        title: i18n.t('order_status.collected'),
        description: `${formatDate(order.finalisedAt)} (updated)`,
        status: 'finish',
      });
    } else if (order.status == 'failed_by_buyer') {
      steps.push(shipped);
      steps.push({
        // or refused (still not determined in API side)
        title: i18n.t('order_status.failed_to_collect'),
        description: `${formatDate(order.finalisedAt)} (updated)`,
        status: 'error',
      });
    } else if (order.status == 'failed_by_seller') {
      steps.push({
        title: i18n.t('order_status.failed_to_ship'),
        description: `${formatDate(order.finalisedAt)} (updated)`,
        status: 'error',
      });
    }
    return steps;
  }

  render() {
    const steps = this.generateSteps(this.props.order);

    if (!steps) return null;

    return (
      <View
        style={[{ alignItems: 'center', marginBottom: -30 }, this.props.style]}>
        <Steps>
          {steps.map((item: any, index: number) => (
            <Step
              key={index}
              title={item.title}
              description={item.description}
              status={item.status}
            />
          ))}
        </Steps>
      </View>
    );
  }
}

export default OrderStatus;

const styles = StyleSheet.create({
  itemImage: {
    marginHorizontal: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.grey4,
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  username: {
    color: colors.grey1,
  },
  reviewText: {
    flex: 1,
    // textAlignVertical: 'bottom', // android
    paddingBottom: 5,
  },
  statusText: {
    fontStyle: 'italic',
    // textAlignVertical: 'bottom', // android
    paddingBottom: 5,
  },
});
