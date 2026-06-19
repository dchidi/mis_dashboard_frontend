import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import style from "./Table.module.css";

type TableAlign = "left" | "center" | "right";

export interface TableColumn<Row> {
  cellAlign?: TableAlign;
  header: ReactNode;
  headerAlign?: TableAlign;
  isRowHeader?: boolean;
  key: string;
  render: (row: Row) => ReactNode;
  width?: string;
}

interface TableProps<Row> {
  className?: string;
  columns: TableColumn<Row>[];
  layout?: "auto" | "fixed";
  minWidth?: string;
  mobileMinWidth?: string;
  nowrap?: boolean;
  rowKey: (row: Row, index: number) => string | number;
  rows: Row[];
  size?: "default" | "small";
}

const Table = <Row,>({
  className,
  columns,
  layout = "auto",
  minWidth,
  mobileMinWidth,
  nowrap = false,
  rowKey,
  rows,
  size = "default",
}: TableProps<Row>) => {
  const stickyColumnIndex = columns[0]?.isRowHeader ? 0 : -1;
  const rootStyle = {
    ...(minWidth ? { "--table-min-width": minWidth } : {}),
    ...(mobileMinWidth
      ? { "--table-mobile-min-width": mobileMinWidth }
      : {}),
  } as CSSProperties;

  return (
    <div
      className={clsx(style.wrap, className, size === "small" && style.small)}
      style={rootStyle}
    >
      <table
        className={clsx(
          style.table,
          layout === "fixed" && style.fixedLayout,
          nowrap && style.nowrap,
        )}
      >
        <thead>
          <tr>
            {columns.map((column, columnIndex) => (
              <th
                className={
                  columnIndex === stickyColumnIndex ? style.stickyHeader : undefined
                }
                key={column.key}
                scope="col"
                style={{
                  textAlign: column.headerAlign ?? column.cellAlign,
                  width: column.width,
                }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const key = rowKey(row, index);

            return (
              <tr key={key}>
                {columns.map((column, columnIndex) => {
                  const content = column.render(row);
                  const cellStyle = {
                    textAlign: column.cellAlign,
                    width: column.width,
                  };
                  const isStickyColumn = columnIndex === stickyColumnIndex;

                  if (column.isRowHeader) {
                    return (
                      <th
                        className={clsx(
                          style.rowHeader,
                          isStickyColumn && style.stickyRowHeader,
                        )}
                        key={`${key}-${column.key}`}
                        scope="row"
                        style={cellStyle}
                      >
                        {content}
                      </th>
                    );
                  }

                  return (
                    <td key={`${key}-${column.key}`} style={cellStyle}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
