/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Card, { CardContent } from 'material-ui/Card';

/**
 * 折线图
 * @param {Object} props 具有chartData属性，是折线图的数据源
 */
const TimeChart = ({ chartData }) => {

  return (
    <div>
      <Card >
        <CardContent >
          <ScatterChart width={570} height={145}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="datetime" />
            <YAxis domain={[0, chartData.dataMax]} dataKey="count" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={chartData.displayData} fill="#5bc5c2" line={{ stroke: '#5bc5c2', strokeWidth: 2 }} />
          </ScatterChart>
        </CardContent>
      </Card>
    </div >
  );
}

export default TimeChart;
