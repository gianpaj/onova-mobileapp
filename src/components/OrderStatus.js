// @flow

import React, { PureComponent } from 'react';
import { Steps } from 'antd-mobile-rn';
import { StyleSheet, View } from 'react-native';
import { differenceInHours, format } from 'date-fns';

import I18n from '../i18n';

import type { Order } from '../types';

type Props = {
  order: Order,
  style: ?any,
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
    if (order.status == 'pending' || order.status == 'paid') {
      return null;
    }

    const steps = [
      {
        title: I18n.t('order_status.confirmed'),
        description: formatDate(order.datePaid),
        status: 'finish',
      },
    ];

    const shipped = {
      title: I18n.t('order_status.shipped'),
      description: `${formatDate(order.dateShipped)} ${I18n.t(
        'order_status.updated'
      )}`,
      status: 'finish',
    };
    const delivered = {
      title: I18n.t('order_status.delivered'),
      description: `${formatDate(order.dateDelivered)} ${I18n.t(
        'order_status.updated'
      )}`,
      status: 'finish',
    };
    if (order.status == 'confirmed') {
      steps.push({
        title: I18n.t('order_status.not_shipped'),
        status: 'wait',
      });
    } else if (order.status == 'shipped') {
      steps.push(shipped);
      steps.push({
        title: I18n.t('order_status.not_delivered'),
        status: 'wait',
      });
    } else if (order.status == 'delivered') {
      steps.push(shipped);
      steps.push(delivered);
      steps.push({
        title: I18n.t('order_status.not_collected'),
        status: 'wait',
      });
    } else if (order.status == 'completed') {
      steps.push(shipped);
      steps.push(delivered);
      steps.push({
        title: I18n.t('order_status.collected'),
        description: `${formatDate(order.finalisedAt)} ${I18n.t(
          'order_status.updated'
        )}`,
        status: 'finish',
      });
    } else if (order.status == 'failed_by_buyer') {
      steps.push(shipped);
      steps.push(delivered);
      steps.push({
        // or refused (still not determined in API side)
        title: I18n.t('order_status.failed_to_collect'),
        description: `${formatDate(order.finalisedAt)} ${I18n.t(
          'order_status.updated'
        )}`,
        status: 'error',
      });
    } else if (order.status == 'failed_by_seller') {
      steps.push({
        title: I18n.t('order_status.failed_to_ship'),
        description: `${formatDate(order.finalisedAt)} ${I18n.t(
          'order_status.updated'
        )}`,
        status: 'error',
      });
    }
    return steps;
  }

  render() {
    const steps = this.generateSteps(this.props.order);

    if (!steps) return null;

    return (
      <View style={[styles.container, this.props.style]}>
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
  container: { alignItems: 'center', marginBottom: -30 },
});
