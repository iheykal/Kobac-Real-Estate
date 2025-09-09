'use client';

import { useState } from 'react';

export default function TestUpdateKobac() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const updateKobacPassword = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/update-kobac-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Update Kobac Password
        </h1>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This will update Kobac's password to <code className="bg-gray-200 px-2 py-1 rounded">8080kobac</code>
          </p>
          
          <button
            onClick={updateKobacPassword}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
          >
            {loading ? 'Updating...' : 'Update Kobac Password'}
          </button>
        </div>
        
        {result && (
          <div className={`p-4 rounded-lg ${
            result.success ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'
          }`}>
            <h3 className={`font-bold ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ Success!' : '❌ Error'}
            </h3>
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
