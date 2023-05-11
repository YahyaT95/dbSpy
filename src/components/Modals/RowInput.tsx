import React from 'react';
import useSchemaStore from '../../store/schemaStore';

type RowInputProps = {
  tableName;
  currentTable;
  handleRowChange: (
    index: number,
    value: string | boolean
  ) => void;
  secondaryColumnNames: string[]
};

function DataRowInput({
tableName,currentTable, handleRowChange, secondaryColumnNames
}: RowInputProps) {

  const { schemaStore } = useSchemaStore((state) => state);
  
  const arrOfDataType = schemaStore["public." + tableName]
  const columns = [];
  const inputs = [];
  let columnNames: string[];
  if (!currentTable.length) {
    columnNames = secondaryColumnNames;
  } else {
    columnNames = Object.keys(currentTable[0]);
  }
    columnNames.map((each, i) => {
      columns.push(<label key={i+each} className=" m-2 text-center text-slate-900 dark:text-[#f8f4eb]">
        {each}
      </label>);
    });
  for (let i = 0; i < columns.length; i++) {
    inputs.push(
      <input
        key={i+columns[i]}
        className='m-2 w-300'
        type="text"
        placeholder={arrOfDataType[columnNames[i]].data_type}
        // placeholder={arrOfDataType[columnNames[i]].data_type + ", "  +arrOfDataType[columnNames[i]].additional_constraints}
        maxLength={63}
        onChange={(e) => {
          handleRowChange(i, e.target.value.trim());
        }}
      />);
  }
  
  return (
    <div className="column-input">
      <div>
        {columns}
      </div>
      <div>
        {inputs}
      </div>
    </div>
  );
}

export default DataRowInput;
