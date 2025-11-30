import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAssetContext } from '../context/AssetContext';
import { FileText, Database, Clock, Activity, CheckCircle, AlertTriangle, User, Key, Bell, Info, Shield, Monitor, FileSpreadsheet } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];
const REMARKS_COLORS = {
  Good: '#16a34a', // green-600
  Bad: '#f97316', // orange-500
  Critical: '#dc2626', // red-600
  Unknown: '#9ca3af' // gray-400
};

const Dashboard: React.FC = () => {
  const { data: liveData } = useAssetContext(); // Access live data from context
  
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalAssets: 0, 
    lastExtraction: 'Never',
    userEmail: 'Loading...',
  });
  
  const [chartData, setChartData] = useState<{
    os: any[];
    office: any[];
    antivirus: any[];
    compliance: any[];
  }>({
    os: [],
    office: [],
    antivirus: [],
    compliance: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [liveData]); // Re-run when liveData updates

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let userEmail = user?.email || 'Guest Admin';
      
      let historicalAssets: any[] = [];
      let totalFiles = 0;
      let lastExtraction = 'Never';

      // 1. Try fetching History from Supabase
      if (user) {
        const { data: history, error } = await supabase
          .from('extraction_history')
          .select('created_at, extracted_json')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && history) {
            totalFiles = history.length;
            if (history.length > 0) {
                lastExtraction = new Date(history[0].created_at).toLocaleString();
            }
            history.forEach(record => {
                if (Array.isArray(record.extracted_json)) {
                    historicalAssets = [...historicalAssets, ...record.extracted_json];
                }
            });
        }
      }

      // 2. Merge with Live Data (deduplicating by Asset Tag if possible, or just preferring Live for stats)
      // For dashboard visual purposes, we combine them. In a real app, you'd handle duplicates strictly.
      // Here, we'll use Live Data as primary source for charts if available (Session view), 
      // or fall back to Historical if Live is empty.
      
      const activeData = liveData.length > 0 ? liveData : historicalAssets;
      
      setStats({
        totalFiles: liveData.length > 0 ? liveData.length : totalFiles, // Approximation for live session
        totalAssets: activeData.length,
        lastExtraction: liveData.length > 0 ? 'Just now' : lastExtraction,
        userEmail
      });

      // 3. Process Data for Charts
      processCharts(activeData);

    } catch (error) {
      console.error("Error fetching stats", error);
    } finally {
      setLoading(false);
    }
  };

  const processCharts = (data: any[]) => {
    // OS Distribution
    const osMap: Record<string, number> = {};
    const officeMap: Record<string, number> = {};
    const avMap: Record<string, number> = {};
    const complianceMap: Record<string, number> = { Good: 0, Bad: 0, Critical: 0 };

    data.forEach(item => {
        // OS
        const os = item["Operating System OS"] || "Unknown";
        // Clean up common names
        let cleanOs = os.replace("Microsoft ", "").replace("Windows ", "Win ");
        if (cleanOs.length > 15) cleanOs = cleanOs.substring(0, 15) + "..";
        osMap[cleanOs] = (osMap[cleanOs] || 0) + 1;

        // Office
        const office = item["MS Office Version"] || "nill";
        const cleanOffice = office === 'nill' ? 'No Office' : office;
        officeMap[cleanOffice] = (officeMap[cleanOffice] || 0) + 1;

        // Antivirus
        const av = item["Antivirus"] || "nill";
        let cleanAv = av;
        if (!av || av.toLowerCase() === 'nill' || av.trim() === '') {
            cleanAv = 'None';
        } else {
            // Remove common noise if needed, or keep full name
            cleanAv = cleanAv.trim();
            if (cleanAv.length > 15) cleanAv = cleanAv.substring(0, 15) + "..";
        }
        avMap[cleanAv] = (avMap[cleanAv] || 0) + 1;

        // Remarks / Compliance
        const remark = item["Remarks"] || "";
        if (remark.includes("Critical")) complianceMap.Critical++;
        else if (remark.includes("Bad")) complianceMap.Bad++;
        else if (remark.includes("Good")) complianceMap.Good++;
    });

    setChartData({
        os: Object.entries(osMap).map(([name, value]) => ({ name, value })),
        office: Object.entries(officeMap).map(([name, value]) => ({ name, value })),
        antivirus: Object.entries(avMap).map(([name, value]) => ({ name, value })),
        compliance: Object.entries(complianceMap)
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({ name, value }))
    });
  };

  if (loading) {
     return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Overview of your asset inventory and compliance status.</p>
         </div>
         <div className="mt-4 md:mt-0 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center shadow-sm">
            <Activity className="w-4 h-4 mr-2" />
            Live Session Active
         </div>
      </div>

      {/* Stats Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-medium text-gray-500">Total Assets</p>
                   <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAssets}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-lg">
                   <Monitor className="w-6 h-6 text-indigo-600" />
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Active Inventory</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-green-200 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-medium text-gray-500">Compliance Score</p>
                   <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalAssets > 0 
                        ? Math.round((chartData.compliance.find(c => c.name === 'Good')?.value || 0) / stats.totalAssets * 100) 
                        : 0}%
                   </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                   <Shield className="w-6 h-6 text-green-600" />
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Assets marked 'Good'</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-orange-200 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-medium text-gray-500">Last Update</p>
                   <p className="text-xs font-bold text-gray-900 mt-1 break-words">{stats.lastExtraction}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                   <Clock className="w-6 h-6 text-orange-600" />
                </div>
            </div>
             <p className="text-xs text-gray-400 mt-4">System activity</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-medium text-gray-500">User</p>
                   <p className="text-sm font-bold text-gray-900 mt-1 truncate max-w-[120px]" title={stats.userEmail}>{stats.userEmail}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                   <User className="w-6 h-6 text-blue-600" />
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Current session</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* OS Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                <Database className="w-4 h-4 mr-2 text-gray-500" />
                Windows OS Distribution
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.os} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0088FE" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Compliance Donut */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-gray-500" />
                Security Compliance (TPM/CPU/OS)
             </h3>
             <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData.compliance}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.compliance.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={REMARKS_COLORS[entry.name as keyof typeof REMARKS_COLORS] || '#8884d8'} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Office Versions */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-gray-500" />
                MS Office Versions
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData.office}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {chartData.office.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Antivirus Status - Column Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
             <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-gray-500" />
                Antivirus Distribution
             </h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={chartData.antivirus} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} barSize={40}>
                            {chartData.antivirus.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Notifications / System Messages */}
         <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-semibold text-gray-800 flex items-center">
                    <Bell className="w-4 h-4 mr-2 text-gray-500" />
                    Live Notifications
                 </h3>
                 <span className="text-xs text-gray-400">Real-time</span>
             </div>
             <div className="p-6 space-y-4">
                 <div className="flex items-start p-4 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                    <div>
                        <h4 className="text-sm font-medium text-green-800">System Optimized</h4>
                        <p className="text-xs text-green-600 mt-1">
                            Extraction engine (AssetIQ AI Assistant) is calibrated. 
                            {stats.totalFiles > 0 
                              ? ` Successfully processed ${stats.totalFiles} files.` 
                              : " Ready to process your first file."}
                        </p>
                    </div>
                 </div>

                 {stats.totalAssets === 0 && (
                     <div className="flex items-start p-4 bg-amber-50 rounded-lg border border-amber-100">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3" />
                        <div>
                            <h4 className="text-sm font-medium text-amber-800">Pending Action</h4>
                            <p className="text-xs text-amber-600 mt-1">No data available for visualization. Navigate to 'Assets' to upload files.</p>
                        </div>
                     </div>
                 )}
             </div>
         </div>

         {/* User Settings Preview */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                 <h3 className="font-semibold text-gray-800 flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    Profile & Settings
                 </h3>
             </div>
             <div className="p-6 space-y-6">
                 <div>
                     <label className="text-xs font-semibold text-gray-500 uppercase">Registered Email</label>
                     <div className="mt-1 flex items-center text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200 truncate">
                         <User className="w-4 h-4 mr-2 text-gray-400" />
                         {stats.userEmail}
                     </div>
                 </div>
                 
                 <div>
                     <label className="text-xs font-semibold text-gray-500 uppercase">Security</label>
                     <button 
                        onClick={() => alert("Password reset functionality requires email integration.")}
                        className="mt-2 w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                     >
                         <Key className="w-4 h-4 mr-2" />
                         Change Password
                     </button>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;