'use client';

import { useEffect, useState } from 'react';

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/agents`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAgents(data);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent w-16 h-16"></div>
        <p className="mt-4 text-gray-600">Loading agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Error Loading Agents
        </h2>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => fetchAgents()}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Registered Agents</h1>
        <a 
          href="/agents/register" 
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded"
        >
          Register New Agent
        </a>
      </div>
      
      {agents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No agents registered yet. Be the first to register!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{agent.name}</h2>
                  <p className="text-gray-600">{agent.agent_id}</p>
                  <p className="text-gray-600">{agent.email}</p>
                </div>
                <div className="space-x-2">
                  <span 
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      agent.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : agent.status === 'suspended'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
              </div>
              
              {agent.capabilities.length > 0 && (
                <div className="mt-3">
                  <span className="font-medium text-gray-700">Capabilities:</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {agent.capabilities.map((cap: string) => (
                      <span 
                        key={cap} 
                        className="bg-blue-50 text-blue-800 text-xs font-medium px-2 py-1 rounded"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                Created: {new Date(agent.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}