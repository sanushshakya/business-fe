// src/components/ScrollableTable.jsx

/**
 * ScrollableTable component to wrap shadcn/ui Table with horizontal scrolling and sticky first column.
 *
 * @param {Object} props - The props object for the ScrollableTable component.
 * @param {React.ReactNode} props.children - The child elements to be rendered inside the table.
 * @returns {React.FC} - The ScrollableTable component.
 */
const ScrollableTable = ({ children }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {React.Children.map(children, (child) =>
              React.cloneElement(child, { sticky: 'left' })
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {React.Children.map(children, (child) =>
            React.cloneElement(child, { sticky: false })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ScrollableTable;