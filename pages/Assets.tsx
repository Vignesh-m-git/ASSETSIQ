import React, { useState, useEffect } from 'react';
import { useAssetContext } from '../context/AssetContext';
import FileUploader from '../components/FileUploader';
import ExtractionTable from '../components/ExtractionTable';
import { exportToCSV, exportToXLSX, exportToJSON } from '../utils/exportUtils';
import { Loader2, Download, X, UploadCloud, Activity, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const Assets: React.FC = () => {
  const { data, setData, fileQueue, addFilesToQueue, isQueueProcessing, toast, clearToast, selectedModel, setSelectedModel } = useAssetContext();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProcessPanel, setShowProcessPanel] = useState(false);

  // Auto-open the process panel if items are added or processing
  useEffect(() => {
    if (fileQueue.length > 0 && isQueueProcessing) {
      setShowProcessPanel(true);
    }
  }, [fileQueue.length, isQueueProcessing]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  const handleStartExtraction = (files: File[]) => {
    addFilesToQueue(files);
    setShowUploadModal(false);
  };

  const processingCount = fileQueue.filter(i => i.status === 'processing' || i.status === 'pending').length;
  const completedCount = fileQueue.filter(i => i.status === 'completed').length;

  return (
    <div className="relative h-full flex flex-col animate-in fade-in duration-300 overflow-hidden">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg border flex items-center animate-in slide-in-from-right-10 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 mr-2" />}
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={clearToast} className="ml-4 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets Manager</h1>
          <p className="text-gray-500 mt-1">Upload files, view extracted data, and export reports.</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
            <span className="text-xs font-medium text-gray-500 mr-2">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
            >
              <option value="gemini">Gemini 2.5 Flash</option>
              <option value="glm">GLM-4.5 Flash</option>
            </select>
          </div>

          <button
            onClick={() => setShowProcessPanel(!showProcessPanel)}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg border transition-all ${showProcessPanel
              ? 'bg-gray-100 border-gray-300 text-gray-800'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Activity className={`w-4 h-4 mr-2 ${isQueueProcessing ? 'text-blue-600 animate-pulse' : 'text-gray-400'}`} />
            Process Queue
            {processingCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {processingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Main Layout Area: Table + Sidebar */}
      <div className="flex flex-1 overflow-hidden relative gap-4">

        {/* Main Table Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col min-w-0 transition-all duration-300">
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{data.length}</span> assets loaded
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportToCSV(data, 'assetiq_export')}
                disabled={data.length === 0}
                className="flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <Download className="w-3 h-3 mr-1.5" /> CSV
              </button>
              <button
                onClick={() => exportToXLSX(data, 'assetiq_export')}
                disabled={data.length === 0}
                className="flex items-center px-3 py-2 text-xs font-medium text-white bg-green-600 border border-green-600 rounded hover:bg-green-700 disabled:opacity-50"
              >
                <Download className="w-3 h-3 mr-1.5" /> XLSX
              </button>
              <button
                onClick={() => exportToJSON(data, 'assetiq_export')}
                disabled={data.length === 0}
                className="flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                JSON
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-0">
            <ExtractionTable data={data} onDataUpdate={setData} />
          </div>
        </div>

        {/* Right Sidebar: Process Manager */}
        <div
          className={`
                fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-gray-200
                ${showProcessPanel ? 'translate-x-0' : 'translate-x-full'}
                sm:static sm:z-0 sm:shadow-none sm:border-0 sm:bg-transparent
                sm:w-80 sm:block sm:transform-none
            `}
          style={{
            position: window.innerWidth < 640 ? 'fixed' : (showProcessPanel ? 'relative' : 'absolute'),
            display: showProcessPanel ? 'flex' : 'none'
          }}
        >
          <div className="flex flex-col h-full w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-sm">Process Queue</h3>
              <button onClick={() => setShowProcessPanel(false)} className="sm:hidden text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
              <div className="hidden sm:block text-xs text-gray-400">
                {completedCount} done / {processingCount} pending
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {fileQueue.length === 0 && (
                <div className="text-center text-gray-400 py-8 text-sm">
                  <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>No files in queue.</p>
                </div>
              )}

              {fileQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    {item.status === 'pending' && <div className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0" />}
                    {item.status === 'processing' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />}
                    {item.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                    {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}

                    <span className={`text-sm truncate ${item.status === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
                      {item.file.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {fileQueue.length > 0 && (
              <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs text-center text-gray-400">
                {isQueueProcessing ? "Processing files..." : "Queue idle"}
              </div>
            )}
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Upload Asset Reports</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <UploadConfirmationWrapper
                onConfirm={handleStartExtraction}
                onCancel={() => setShowUploadModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UploadConfirmationWrapper: React.FC<{
  onConfirm: (files: File[]) => void,
  onCancel: () => void
}> = ({ onConfirm, onCancel }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  return (
    <div className="space-y-6">
      <FileUploader onFilesSelected={setSelectedFiles} />
      <div className="flex justify-end space-x-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={() => onConfirm(selectedFiles)}
          disabled={selectedFiles.length === 0}
          className="flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
        >
          Start Processing ({selectedFiles.length})
        </button>
      </div>
    </div>
  );
};

export default Assets;