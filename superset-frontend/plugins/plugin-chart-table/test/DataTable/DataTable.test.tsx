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
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@superset-ui/core/spec';
import { Column } from 'react-table';
import DataTable from '../../src/DataTable/DataTable';
import { ProviderWrapper } from '../testHelpers';

type DataRow = { city: string };

const columns: Column<DataRow>[] = [
  {
    Header: 'City',
    id: 'city',
    accessor: 'city',
  },
];

const data: DataRow[] = [{ city: 'Paris' }, { city: 'London' }];

const renderDataTable = (
  props: {
    columns: Column<DataRow>[];
    serverPagination?: boolean;
    onFilteredRowsChange?: (rows: DataRow[]) => void;
  } = { columns },
) => (
  <ProviderWrapper>
    <DataTable<DataRow>
      columns={props.columns}
      data={data}
      rowCount={data.length}
      serverPagination={props.serverPagination ?? false}
      serverPaginationData={{}}
      onServerPaginationChange={jest.fn()}
      handleSortByChange={jest.fn()}
      sortByFromParent={[]}
      onSearchColChange={jest.fn()}
      searchOptions={[]}
      sticky={false}
      onFilteredRowsChange={props.onFilteredRowsChange}
    />
  </ProviderWrapper>
);

test('keeps a stable hook order when columns transition between empty and non-empty', async () => {
  const onFilteredRowsChange = jest.fn();
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  const { rerender } = render(
    renderDataTable({ columns: [], onFilteredRowsChange }),
  );
  expect(screen.getByText('No data found')).toBeInTheDocument();

  rerender(renderDataTable({ columns, onFilteredRowsChange }));
  await waitFor(() => {
    expect(onFilteredRowsChange).toHaveBeenCalledWith(data);
  });

  rerender(renderDataTable({ columns: [], onFilteredRowsChange }));
  expect(screen.getByText('No data found')).toBeInTheDocument();

  const hookWarnings = consoleError.mock.calls.filter(([message]) =>
    String(message).includes('hooks'),
  );
  consoleError.mockRestore();
  expect(hookWarnings).toEqual([]);
});

test('does not emit filtered rows when serverPagination is enabled', async () => {
  const onFilteredRowsChange = jest.fn();

  render(
    renderDataTable({ columns, serverPagination: true, onFilteredRowsChange }),
  );

  await waitFor(() => {
    expect(screen.getByText('Paris')).toBeInTheDocument();
  });
  expect(onFilteredRowsChange).not.toHaveBeenCalled();
});
