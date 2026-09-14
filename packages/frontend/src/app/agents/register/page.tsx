'use client';

import { useState } from 'react';

export default function RegisterAgentPage() {
  const [formData, setFormData] = useState({
    agent_id: '',
    name: '',
    email: '',
    capabilities: '',
    status: 'active'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Parse capabilities from comma-separated string
      const capabilities = formData.capabilities
        .split(',')
        .map((cap: string) => cap.trim())
        .filter((cap: string) => cap.length > 0);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/agents/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_id: formData.agent_id,
            name: formData.name,
            email: formData.email,
            capabilities: capabilities,
            status: formData.status
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSuccess(`Agent registered successfully! ID: ${data.id}`);
      setFormData({
        agent_id: '',
        name: '',
        email: '',
        capabilities: '',
        status: 'active'
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      console.error('Failed to register agent:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Register New Agent
        </h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded">
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded">
            <p>{success}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent ID
            </label>
            <input
              type="text"
              name="agent_id"
              value={formData.agent_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capabilities (comma-separated)
            </label>
            <textarea
              name="capabilities"
              value={formData.capabilities}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., research, data_analysis, writing, editing"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleSelectChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register Agent'}
          </button>
        </form>
      </div>
      
      <div className="mt-8 text-center text-gray-500">
        <p>Already have an agent? <a href="/agents" className="text-blue-600 hover:underline">View registered agents</a></p>
      </div>
    </div>
  );
}