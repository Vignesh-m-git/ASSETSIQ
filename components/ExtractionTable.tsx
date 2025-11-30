import React, { useState, useMemo } from 'react';
import { AssetData, FilterRule, FilterOperator } from '../types';
import { Edit2, Save, X, Check, Trash2, Search, ChevronLeft, ChevronRight, Eye, Filter, Plus, MinusCircle, ArrowUp, ArrowDown, ArrowUpDown, AlertTriangle } from 'lucide-react';

interface ExtractionTableProps {
  data: AssetData[];
  onDataUpdate: (updatedData: AssetData[]) => void;
}

const ORDERED_COLUMNS: (keyof AssetData)[] = [
  "Asset Tag",
  "Block",
  "Floor",
  "Dept",
  "Brand",
  "Service Tag",
  "Computer Name",
  "Processor Type",
  "Processor Generation",
  "Processor Speed (GHz)",
  "RAM (GB)",
  "Hard Drive Type",
  "Hard Drive Size",
  "Graphics Card",
  "Operating System OS",
  "Operating System Architecture",
  "Operating System Version",
  "Windows License Key",
  "MS Office Version",
  "MS Office License Key",
  "Installed Applications",
  "Antivirus",
  "IP Address",
  "Remarks"
];

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' },
];

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
  key: keyof AssetData | null;
  direction: SortDirection;
}

const ExtractionTable: React.FC<ExtractionTableProps> = ({ data, onDataUpdate }) => {
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [tempRowData, setTempRowData] = useState<AssetData | null>(null);
  
  // Filtering & Pagination State
  const [simpleSearch, setSimpleSearch] = useState('');
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof AssetData>>(new Set(ORDERED_COLUMNS));
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Selection & Deletion State
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, type: 'single' | 'bulk', indices: number[] }>({
    isOpen: false, type: 'single', indices: []
  });

  // Toggle Column Visibility
  const toggleColumn = (col: keyof AssetData) => {
    const newSet = new Set(visibleColumns);
    if (newSet.has(col)) {
        if (newSet.size > 1) newSet.delete(col); // Prevent hiding all
    } else {
        newSet.add(col);
    }
    setVisibleColumns(newSet);
  };

  // Add a new filter rule
  const addFilter = () => {
    setFilters([
      ...filters,
      { id: Date.now().toString(), column: 'Asset Tag', operator: 'contains', value: '' }
    ]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, field: keyof FilterRule, value: any) => {
    setFilters(filters.map(f => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const handleSort = (key: keyof AssetData) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  // Process Data
  const processedData = useMemo(() => {
    let result = [...data];

    // 1. Advanced Filters
    if (filters.length > 0) {
      result = result.filter(row => {
        return filters.every(filter => {
          const cellValue = String(row[filter.column] || '').toLowerCase();
          const filterValue = filter.value.toLowerCase();
          switch (filter.operator) {
            case 'contains': return cellValue.includes(filterValue);
            case 'equals': return cellValue === filterValue;
            case 'startsWith': return cellValue.startsWith(filterValue);
            case 'endsWith': return cellValue.endsWith(filterValue);
            case 'isEmpty': return !row[filter.column];
            case 'isNotEmpty': return !!row[filter.column];
            default: return true;
          }
        });
      });
    }

    // 2. Simple Global Search
    if (simpleSearch) {
      const lowerSearch = simpleSearch.toLowerCase();
      result = result.filter(row => 
         Object.values(row).some(val => 
            String(val || '').toLowerCase().includes(lowerSearch)
         )
      );
    }

    // 3. Sorting
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const valA = String(a[sortConfig.key!] || '').toLowerCase();
        const valB = String(b[sortConfig.key!] || '').toLowerCase();
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);
        const isNumeric = !isNaN(numA) && !isNaN(numB) && isFinite(numA) && isFinite(numB);
        if (isNumeric) return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, filters, simpleSearch, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Select all visible on current page
      const currentIndices = new Set(selectedIndices);
      paginatedData.forEach(row => {
        const globalIndex = data.indexOf(row);
        if (globalIndex !== -1) currentIndices.add(globalIndex);
      });
      setSelectedIndices(currentIndices);
    } else {
      // Deselect all visible on current page
      const currentIndices = new Set(selectedIndices);
      paginatedData.forEach(row => {
        const globalIndex = data.indexOf(row);
        if (globalIndex !== -1) currentIndices.delete(globalIndex);
      });
      setSelectedIndices(currentIndices);
    }
  };

  const handleSelectRow = (row: AssetData) => {
    const globalIndex = data.indexOf(row);
    if (globalIndex === -1) return;

    const newIndices = new Set(selectedIndices);
    if (newIndices.has(globalIndex)) {
      newIndices.delete(globalIndex);
    } else {
      newIndices.add(globalIndex);
    }
    setSelectedIndices(newIndices);
  };

  // Edit Handlers
  const handleEditClick = (pageIndex: number, row: AssetData) => {
    setEditingRowIndex(pageIndex);
    setTempRowData({ ...row });
  };

  const handleCancelEdit = () => {
    setEditingRowIndex(null);
    setTempRowData(null);
  };

  const handleSaveEdit = (pageIndex: number) => {
    if (tempRowData) {
       const globalIndex = data.indexOf(paginatedData[pageIndex]);
       if (globalIndex !== -1) {
           const newData = [...data];
           newData[globalIndex] = tempRowData;
           onDataUpdate(newData);
       }
    }
    setEditingRowIndex(null);
    setTempRowData(null);
  };

  const handleInputChange = (field: keyof AssetData, value: string) => {
    if (tempRowData) {
      setTempRowData({ ...tempRowData, [field]: value });
    }
  };

  // Delete Logic
  const initiateDelete = (pageIndex: number) => {
     const globalIndex = data.indexOf(paginatedData[pageIndex]);
     if (globalIndex !== -1) {
       setDeleteConfirmation({ isOpen: true, type: 'single', indices: [globalIndex] });
     }
  };

  const initiateBulkDelete = () => {
    setDeleteConfirmation({ isOpen: true, type: 'bulk', indices: Array.from(selectedIndices) });
  };

  const confirmDelete = () => {
    const indicesToDelete = new Set(deleteConfirmation.indices);
    // Filter out items whose index is in the deletion set
    const newData = data.filter((_, index) => !indicesToDelete.has(index));
    
    onDataUpdate(newData);
    setSelectedIndices(new Set()); // Clear selection
    setDeleteConfirmation({ isOpen: false, type: 'single', indices: [] });
    
    // Adjust page if empty
    if (newData.length < (currentPage - 1) * itemsPerPage + 1 && currentPage > 1) {
      setCurrentPage(p => p - 1);
    }
  };

  // Safe Navigation
  const goToPage = (p: number) => setCurrentPage(Math.min(Math.max(1, p), totalPages));

  if (!data || data.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
             <Search className="w-12 h-12 mb-3 opacity-20" />
             <p>No data available. Upload files to get started.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {deleteConfirmation.type === 'bulk' 
                    ? `Are you sure you want to delete ${deleteConfirmation.indices.length} selected asset(s)?` 
                    : "Are you sure you want to delete this asset?"}
                  <br/>This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3 mt-6">
                   <button 
                     onClick={() => setDeleteConfirmation({ isOpen: false, type: 'single', indices: [] })}
                     className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={confirmDelete}
                     className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors"
                   >
                     Yes, Delete
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-3 bg-white">
          <div className="flex space-x-2 flex-1 max-w-3xl">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Quick search..." 
                    className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-400"
                    value={simpleSearch}
                    onChange={(e) => { setSimpleSearch(e.target.value); setCurrentPage(1); }}
                />
             </div>
             
             <button 
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center px-3 py-2 border rounded-lg text-sm transition-colors ${
                  showFilterPanel || filters.length > 0 
                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
             >
                 <Filter className="w-4 h-4 mr-2" />
                 Filters {filters.length > 0 && `(${filters.length})`}
             </button>

             {selectedIndices.size > 0 && (
               <button 
                 onClick={initiateBulkDelete}
                 className="flex items-center px-3 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100 transition-colors animate-in fade-in"
               >
                 <Trash2 className="w-4 h-4 mr-2" />
                 Delete Selected ({selectedIndices.size})
               </button>
             )}
          </div>
          
          <div className="relative">
              <button 
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 text-gray-700"
              >
                  <Eye className="w-4 h-4 mr-2" />
                  Columns
              </button>
              {showColumnMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto p-2">
                      <div className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase">Toggle Visibility</div>
                      {ORDERED_COLUMNS.map(col => (
                          <label key={col} className="flex items-center px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={visibleColumns.has(col)}
                                onChange={() => toggleColumn(col)}
                                className="mr-2 rounded text-blue-600 focus:ring-blue-500 bg-white"
                              />
                              <span className="text-sm text-gray-700 truncate">{col}</span>
                          </label>
                      ))}
                  </div>
              )}
          </div>
      </div>

      {/* Advanced Filter Panel */}
      {showFilterPanel && (
        <div className="bg-gray-50 border-b border-gray-200 p-4 animate-in slide-in-from-top-2">
           <div className="flex justify-between items-center mb-3">
               <h3 className="text-sm font-semibold text-gray-700">Advanced Filters</h3>
               <button onClick={addFilter} className="text-xs flex items-center text-blue-600 hover:underline font-medium">
                   <Plus className="w-3 h-3 mr-1" /> Add Rule
               </button>
           </div>
           
           <div className="space-y-2">
              {filters.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No filters applied. Click 'Add Rule' to start.</p>
              )}
              {filters.map((filter) => (
                  <div key={filter.id} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <select 
                        value={filter.column} 
                        onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                        className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      >
                          {ORDERED_COLUMNS.map(col => <option key={col} value={col}>{col}</option>)}
                      </select>

                      <select 
                        value={filter.operator} 
                        onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                        className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                      >
                          {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                      </select>

                      {filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty' && (
                          <input 
                            type="text" 
                            value={filter.value} 
                            onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                            className="flex-1 text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 px-2 py-1.5"
                            placeholder="Value..."
                          />
                      )}

                      <button onClick={() => removeFilter(filter.id)} className="text-gray-400 hover:text-red-500">
                          <MinusCircle className="w-4 h-4" />
                      </button>
                  </div>
              ))}
           </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-sm text-left text-gray-500 border-collapse">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
            <tr>
              <th className="px-4 py-3 sticky left-0 bg-gray-50 z-30 w-10 text-center border-r border-gray-200">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={paginatedData.length > 0 && paginatedData.every(row => {
                     const idx = data.indexOf(row);
                     return idx !== -1 && selectedIndices.has(idx);
                  })}
                  className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 bg-white"
                />
              </th>
              <th scope="col" className="px-4 py-3 sticky left-10 bg-gray-50 z-30 w-24 text-center border-r border-gray-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                Actions
              </th>
              {ORDERED_COLUMNS.map((col) => visibleColumns.has(col) && (
                <th 
                    key={col} 
                    scope="col" 
                    className="px-4 py-3 whitespace-nowrap min-w-[150px] border-r border-gray-100 last:border-0 cursor-pointer hover:bg-gray-100 transition-colors group"
                    onClick={() => handleSort(col)}
                >
                  <div className="flex items-center justify-between">
                      {col}
                      <span className="ml-2 text-gray-400 group-hover:text-gray-600">
                          {sortConfig.key === col ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />
                          ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                          )}
                      </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((row, pageIndex) => {
              const isEditing = editingRowIndex === pageIndex;
              const globalIndex = data.indexOf(row);
              const isSelected = globalIndex !== -1 && selectedIndices.has(globalIndex);
              
              // Determine remarks color class
              let remarksClass = "";
              if (row.Remarks?.toLowerCase().includes("critical")) remarksClass = "text-red-600 font-semibold";
              else if (row.Remarks?.toLowerCase().includes("bad")) remarksClass = "text-orange-500 font-medium";
              else if (row.Remarks?.toLowerCase().includes("good")) remarksClass = "text-green-600 font-medium";

              return (
                <tr key={pageIndex} className={`hover:bg-blue-50/50 transition-colors ${isSelected ? 'bg-blue-50' : 'bg-white'}`}>
                  <td className="px-4 py-2 sticky left-0 z-20 text-center border-r border-gray-200 bg-inherit">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleSelectRow(row)}
                      className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 bg-white"
                    />
                  </td>
                  <td className="px-4 py-2 sticky left-10 bg-inherit z-20 flex items-center justify-center space-x-1 border-r border-gray-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSaveEdit(pageIndex)} className="p-1.5 text-green-600 hover:bg-green-100 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={handleCancelEdit} className="p-1.5 text-red-500 hover:bg-red-100 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditClick(pageIndex, row)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => initiateDelete(pageIndex)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                  {ORDERED_COLUMNS.map((col) => visibleColumns.has(col) && (
                    <td key={`${pageIndex}-${col}`} className="px-4 py-2 whitespace-nowrap border-r border-gray-100 last:border-0">
                      {isEditing && tempRowData ? (
                        <input
                          type="text"
                          value={tempRowData[col]}
                          onChange={(e) => handleInputChange(col, e.target.value)}
                          className="w-full px-2 py-1.5 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs shadow-sm bg-white text-gray-900"
                        />
                      ) : (
                        <span className={`block truncate max-w-[200px] ${col === 'Remarks' ? remarksClass : ''}`} title={row[col]}>
                          {row[col] || <span className="text-gray-300 italic text-xs">-</span>}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {paginatedData.length === 0 && (
            <div className="p-8 text-center text-gray-500 italic">No matching records found.</div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
              <span className="mr-2">Rows per page:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-gray-300 rounded p-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                  {ITEMS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <span className="ml-4">
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length}
              </span>
          </div>

          <div className="flex items-center space-x-2">
              <button 
                onClick={() => goToPage(currentPage - 1)} 
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
              >
                  <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                  Page {currentPage} of {totalPages || 1}
              </span>
              <button 
                onClick={() => goToPage(currentPage + 1)} 
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
              >
                  <ChevronRight className="w-5 h-5" />
              </button>
          </div>
      </div>
    </div>
  );
};

export default ExtractionTable;