import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchDatabaseOverview, fetchDatabaseTableRows } from '../services/api';
import type { DatabaseOverview, DatabaseTableOverview, DatabaseTableRowsResponse } from '../types/database';
import type { APIError } from '../types/stock';

interface DatabaseExplorerPageProps {
  onOpenTickerDashboard: () => void;
}

const ROW_LIMIT_OPTIONS = [25, 50, 100];
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

function normalizeAPIError(error: unknown, fallbackMessage: string): APIError {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const candidate = error as APIError;
    return {
      message: candidate.message || fallbackMessage,
      status: candidate.status,
      details: candidate.details ?? error,
    };
  }

  return {
    message: fallbackMessage,
    details: error,
  };
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function formatGeneratedAt(timestamp: string | undefined): string {
  if (!timestamp) {
    return 'Unknown';
  }

  const parsedDate = new Date(timestamp);
  if (Number.isNaN(parsedDate.getTime())) {
    return timestamp;
  }

  return parsedDate.toLocaleString();
}

function resolveVisibleColumns(
  selectedTableOverview: DatabaseTableOverview | null,
  rowsResponse: DatabaseTableRowsResponse | null
): string[] {
  if (selectedTableOverview && selectedTableOverview.columns.length > 0) {
    return selectedTableOverview.columns.map((column) => column.name);
  }

  const firstRow = rowsResponse?.rows[0];
  if (!firstRow) {
    return [];
  }

  return Object.keys(firstRow);
}

export function DatabaseExplorerPage({ onOpenTickerDashboard }: DatabaseExplorerPageProps) {
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<APIError | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rowsResponse, setRowsResponse] = useState<DatabaseTableRowsResponse | null>(null);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [rowsError, setRowsError] = useState<APIError | null>(null);
  const [rowLimit, setRowLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const loadOverview = useCallback(async (signal?: AbortSignal) => {
    setOverviewLoading(true);
    setOverviewError(null);

    try {
      const response = await fetchDatabaseOverview(5, signal);
      setOverview(response);

      setSelectedTable((currentSelection) => {
        if (response.tables.length === 0) {
          return null;
        }

        if (currentSelection && response.tables.some((table) => table.table_name === currentSelection)) {
          return currentSelection;
        }

        return response.tables[0].table_name;
      });

      setOverviewLoading(false);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      setOverviewLoading(false);
      setOverviewError(normalizeAPIError(error, 'Failed to load database metadata'));
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    void loadOverview(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [loadOverview]);

  const selectedTableOverview = useMemo(
    () => overview?.tables.find((table) => table.table_name === selectedTable) ?? null,
    [overview, selectedTable]
  );

  const visibleColumns = useMemo(
    () => resolveVisibleColumns(selectedTableOverview, rowsResponse),
    [selectedTableOverview, rowsResponse]
  );

  const loadRows = useCallback(async (tableName: string, currentLimit: number, currentOffset: number, signal?: AbortSignal) => {
    setRowsLoading(true);
    setRowsError(null);

    try {
      const response = await fetchDatabaseTableRows(tableName, currentLimit, currentOffset, signal);
      setRowsResponse(response);
      setRowsLoading(false);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }

      setRowsLoading(false);
      setRowsError(normalizeAPIError(error, `Failed to load rows for table ${tableName}`));
    }
  }, []);

  useEffect(() => {
    if (!selectedTable) {
      setRowsResponse(null);
      setRowsLoading(false);
      setRowsError(null);
      return;
    }

    const abortController = new AbortController();
    void loadRows(selectedTable, rowLimit, offset, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [loadRows, offset, refreshCounter, rowLimit, selectedTable]);

  const rangeStart = rowsResponse && rowsResponse.total_rows > 0 ? offset + 1 : 0;
  const rangeEnd = rowsResponse ? Math.min(offset + rowsResponse.rows.length, rowsResponse.total_rows) : 0;
  const canGoPrevious = offset > 0;
  const canGoNext = rowsResponse ? offset + rowsResponse.rows.length < rowsResponse.total_rows : false;

  return (
    <div className="h-screen w-screen bg-trading-bg text-trading-text flex flex-col overflow-hidden">
      <header className="px-6 py-4 border-b border-trading-border bg-trading-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Database Explorer</h1>
            <p className="text-sm text-trading-text-secondary">
              Inspect schema, relationships, and table records used by the backend.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void loadOverview();
                setRefreshCounter((counter) => counter + 1);
              }}
              className="px-4 py-2 text-sm font-medium rounded-md border border-trading-border-strong bg-trading-surface hover:bg-trading-hover transition-trading"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onOpenTickerDashboard}
              className="px-4 py-2 text-sm font-medium rounded-md border border-trading-border-strong bg-trading-active hover:bg-trading-hover transition-trading"
            >
              Back To Ticker Dashboard
            </button>
          </div>
        </div>
      </header>

      <section className="px-6 py-3 border-b border-trading-border bg-trading-panel/40">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border border-trading-border bg-trading-panel px-3 py-2">
            <p className="text-trading-text-muted">Tables</p>
            <p className="text-lg font-semibold">{overview ? NUMBER_FORMATTER.format(overview.total_tables) : '--'}</p>
          </div>
          <div className="rounded-md border border-trading-border bg-trading-panel px-3 py-2">
            <p className="text-trading-text-muted">Rows</p>
            <p className="text-lg font-semibold">{overview ? NUMBER_FORMATTER.format(overview.total_rows) : '--'}</p>
          </div>
          <div className="rounded-md border border-trading-border bg-trading-panel px-3 py-2">
            <p className="text-trading-text-muted">Last Refreshed</p>
            <p className="text-sm font-medium">{formatGeneratedAt(overview?.generated_at)}</p>
          </div>
        </div>
      </section>

      <main className="flex-1 min-h-0 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        <aside className="col-span-12 lg:col-span-3 min-h-0 rounded-lg border border-trading-border bg-trading-panel flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-trading-border text-sm font-semibold">Tables</div>
          <div className="flex-1 overflow-auto">
            {overviewLoading && <p className="px-3 py-3 text-sm text-trading-text-secondary">Loading table metadata...</p>}
            {!overviewLoading && overviewError && (
              <p className="px-3 py-3 text-sm text-trading-red">{overviewError.message}</p>
            )}
            {!overviewLoading && !overviewError && overview?.tables.length === 0 && (
              <p className="px-3 py-3 text-sm text-trading-text-secondary">No tables found in the database.</p>
            )}
            {!overviewLoading && !overviewError && overview?.tables.map((table) => {
              const isSelected = table.table_name === selectedTable;
              return (
                <button
                  key={table.table_name}
                  type="button"
                  onClick={() => {
                    setSelectedTable(table.table_name);
                    setOffset(0);
                  }}
                  className={`w-full text-left px-3 py-2 border-b border-trading-border text-sm transition-trading ${
                    isSelected ? 'bg-trading-active text-trading-text' : 'hover:bg-trading-hover text-trading-text-secondary'
                  }`}
                >
                  <div className="font-medium">{table.table_name}</div>
                  <div className="text-xs text-trading-text-muted">{NUMBER_FORMATTER.format(table.row_count)} rows</div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-9 min-h-0 flex flex-col gap-4 overflow-hidden">
          {!selectedTableOverview && !overviewLoading && (
            <div className="rounded-lg border border-trading-border bg-trading-panel p-4 text-sm text-trading-text-secondary">
              Select a table to inspect its schema and records.
            </div>
          )}

          {selectedTableOverview && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-lg border border-trading-border bg-trading-panel overflow-hidden">
                  <div className="px-4 py-3 border-b border-trading-border">
                    <h2 className="text-sm font-semibold">Columns: {selectedTableOverview.table_name}</h2>
                  </div>
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-trading-surface">
                        <tr className="text-left">
                          <th className="px-3 py-2 font-medium">Column</th>
                          <th className="px-3 py-2 font-medium">Type</th>
                          <th className="px-3 py-2 font-medium">Nullable</th>
                          <th className="px-3 py-2 font-medium">PK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTableOverview.columns.map((column) => (
                          <tr key={column.name} className="border-t border-trading-border">
                            <td className="px-3 py-2 font-mono text-xs">{column.name}</td>
                            <td className="px-3 py-2 text-xs">{column.data_type}</td>
                            <td className="px-3 py-2 text-xs">{column.is_nullable ? 'YES' : 'NO'}</td>
                            <td className="px-3 py-2 text-xs">{column.is_primary_key ? 'YES' : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border border-trading-border bg-trading-panel overflow-hidden">
                  <div className="px-4 py-3 border-b border-trading-border">
                    <h2 className="text-sm font-semibold">Relationships</h2>
                  </div>
                  <div className="p-4 text-sm">
                    {selectedTableOverview.foreign_keys.length === 0 && (
                      <p className="text-trading-text-secondary">No foreign keys defined for this table.</p>
                    )}
                    {selectedTableOverview.foreign_keys.length > 0 && (
                      <ul className="space-y-2">
                        {selectedTableOverview.foreign_keys.map((foreignKey) => (
                          <li key={`${foreignKey.column_name}:${foreignKey.referenced_table}:${foreignKey.referenced_column}`} className="rounded-md border border-trading-border p-2 bg-trading-surface">
                            <p className="font-mono text-xs">
                              {foreignKey.column_name} -&gt; {foreignKey.referenced_table}.{foreignKey.referenced_column}
                            </p>
                            <p className="text-xs text-trading-text-muted">
                              On Delete: {foreignKey.on_delete || 'NO ACTION'}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-trading-border bg-trading-panel flex-1 min-h-0 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-trading-border flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold">Records</h2>
                  <div className="flex items-center gap-2 text-sm">
                    <label htmlFor="row-limit-select" className="text-trading-text-secondary">Rows/Page</label>
                    <select
                      id="row-limit-select"
                      value={rowLimit}
                      onChange={(event) => {
                        setRowLimit(Number(event.target.value));
                        setOffset(0);
                      }}
                      className="bg-trading-surface border border-trading-border rounded px-2 py-1 text-sm"
                    >
                      {ROW_LIMIT_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setOffset((previous) => Math.max(0, previous - rowLimit))}
                      disabled={!canGoPrevious || rowsLoading}
                      className="px-3 py-1 rounded border border-trading-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-trading-hover transition-trading"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (canGoNext) {
                          setOffset((previous) => previous + rowLimit);
                        }
                      }}
                      disabled={!canGoNext || rowsLoading}
                      className="px-3 py-1 rounded border border-trading-border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-trading-hover transition-trading"
                    >
                      Next
                    </button>
                    <span className="text-trading-text-muted">
                      {rangeStart}-{rangeEnd} of {rowsResponse ? NUMBER_FORMATTER.format(rowsResponse.total_rows) : '--'}
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-auto">
                  {rowsLoading && (
                    <p className="px-4 py-3 text-sm text-trading-text-secondary">Loading rows...</p>
                  )}
                  {!rowsLoading && rowsError && (
                    <p className="px-4 py-3 text-sm text-trading-red">{rowsError.message}</p>
                  )}
                  {!rowsLoading && !rowsError && rowsResponse && rowsResponse.rows.length === 0 && (
                    <p className="px-4 py-3 text-sm text-trading-text-secondary">No rows available for this table.</p>
                  )}

                  {!rowsLoading && !rowsError && rowsResponse && rowsResponse.rows.length > 0 && (
                    <table className="w-full text-sm border-collapse">
                      <thead className="sticky top-0 bg-trading-surface border-b border-trading-border">
                        <tr>
                          {visibleColumns.map((columnName) => (
                            <th key={columnName} className="px-3 py-2 text-left font-medium whitespace-nowrap">
                              {columnName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rowsResponse.rows.map((row, index) => (
                          <tr
                            key={`${rowsResponse.offset + index}`}
                            className="border-b border-trading-border hover:bg-trading-surface/60"
                          >
                            {visibleColumns.map((columnName) => {
                              const value = row[columnName];
                              const formattedValue = formatCellValue(value);
                              const displayValue = formattedValue.length > 140
                                ? `${formattedValue.slice(0, 140)}...`
                                : formattedValue;

                              return (
                                <td
                                  key={`${rowsResponse.offset + index}:${columnName}`}
                                  className="px-3 py-2 font-mono text-xs align-top max-w-[420px]"
                                  title={formattedValue}
                                >
                                  {displayValue}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
