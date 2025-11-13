import PropTypes from "prop-types";

export default function TableHeader({ columns }) {
  return (
    <thead className="h-100 bg-light align-middle">
      <tr>
        {columns.map((col, i) => (
          <th
            key={col + "-" + i}
            className="text-center align-middle pt-2 fw-bold text-primary small"
            style={{ whiteSpace: "nowrap" }}
            title={col}
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );
}

TableHeader.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
};
