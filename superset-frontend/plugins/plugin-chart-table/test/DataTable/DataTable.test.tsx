/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { render, waitFor } from '@testing-library/react';
import { ColumnWithLooseAccessor } from 'react-table';
import DataTable, { DataTableProps } from '../../src/DataTable/DataTable';
import { ProviderWrapper } from '../testHelpers';

type Row = { name: string };

const data: Row[] = [{ name: 'foo' }, { name: 'bar' }];

const columns: ColumnWithLooseAccessor<Row>[] = [
  { id: 'name', accessor: 'name', Header: 'Name' },
];

const defaultProps: DataTableProps<Row> = {
  columns,
  data,
  rowCount: data.length,
  serverPaginationData: {},
  onServerPaginationChange: jest.fn(),
  handleSortByChange: jest.fn(),
  sortByFromParent: [],
  onSearchColChange: jest.fn(),
  searchOptions: [],
};

const renderTable = (props: Partial<DataTableProps<Row>> = {}) =>
  render(<DataTable<Row> {...defaultProps} {...props} />, {
    wrapper: ProviderWrapper,
  });

test('does not break the rules of hooks when columns become empty', async () => {
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  const onFilteredRowsChange = jest.fn();

  const { rerender, getByText } = renderTable({ onFilteredRowsChange });

  rerender(
    <DataTable<Row>
      {...defaultProps}
      columns={[]}
      onFilteredRowsChange={onFilteredRowsChange}
    />,
  );
  expect(getByText('No data found')).toBeTruthy();

  rerender(
    <DataTable<Row>
      {...defaultProps}
      onFilteredRowsChange={onFilteredRowsChange}
    />,
  );

  const hookErrors = consoleError.mock.calls.filter(([message]) =>
    /hook/i.test(String(message)),
  );
  consoleError.mockRestore();
  expect(hookErrors).toEqual([]);
});

test('emits filtered rows in client-side mode', async () => {
  const onFilteredRowsChange = jest.fn();
  renderTable({ onFilteredRowsChange });

  await waitFor(() => expect(onFilteredRowsChange).toHaveBeenCalled());
  expect(onFilteredRowsChange).toHaveBeenLastCalledWith(data);
});

test('does not emit filtered rows when serverPagination is true', async () => {
  const onFilteredRowsChange = jest.fn();
  renderTable({ onFilteredRowsChange, serverPagination: true });

  await new Promise(resolve => {
    requestAnimationFrame(() => resolve(undefined));
  });
  expect(onFilteredRowsChange).not.toHaveBeenCalled();
});
