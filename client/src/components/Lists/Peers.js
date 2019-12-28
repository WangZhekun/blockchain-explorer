/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Container, Row, Col } from 'reactstrap';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import matchSorter from 'match-sorter';

/**
 * Peer节点列表
 * @param {Object} props 包含peerList属性的对象 —— 组件的props 
 */
const Peers = ({ peerList }) => {
    const columnHeaders = [
        {
            Header: "Peer Name", // peer名称
            accessor: "server_hostname",
            filterMethod: (filter, rows) =>
                matchSorter(rows, filter.value, { keys: ["server_hostname"] }, { threshold: matchSorter.rankings.SIMPLEMATCH }),
            filterAll: true
        },
        {
            Header: "Request Url", // 请求地址
            accessor: "requests",
            filterMethod: (filter, rows) =>
                matchSorter(rows, filter.value, { keys: ["requests"] }, { threshold: matchSorter.rankings.SIMPLEMATCH }),
            filterAll: true
        }
    ];

    return (
        <div>
            <ReactTable
                data={peerList}
                columns={columnHeaders}
                defaultPageSize={5}
                className="-striped -highlight"
                filterable
                minRows={0}
            />
        </div>
    );
};

export default Peers;
