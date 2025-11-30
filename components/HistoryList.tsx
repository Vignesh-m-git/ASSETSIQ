import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { ExtractionHistoryItem } from '../types';
import { Download, Trash2, Calendar, FileText } from 'lucide-react';
import { exportToCSV, exportToXLSX } from '../utils/exportUtils';

const HistoryList: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
  const [history, setHistory] = useState<ExtractionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('extraction_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const { error } = await supabase.from('extraction_history').delete().eq('id', id);
      if (error) throw error;
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (loading) return <div className="p-4 text-center text-gray-500">Loading history...</div>;
  if (history.length === 0) return <div className="p-4 text-center text-gray-400">No extraction history found.</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Recent Extractions</h3>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {history.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-700 truncate max-w-[150px]" title={item.filename}>
                  {item.filename}
                </span>
              </div>
              <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center text-xs text-gray-500 mb-4">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
            </div>

            <div className="flex space-x-2 mt-auto">
              <button
                onClick={() => exportToCSV(item.extracted_json, `${item.filename}_extracted`)}
                className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                <Download className="w-3 h-3 mr-1" /> CSV
              </button>
              <button
                onClick={() => exportToXLSX(item.extracted_json, `${item.filename}_extracted`)}
                className="flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
              >
                <Download className="w-3 h-3 mr-1" /> Excel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
