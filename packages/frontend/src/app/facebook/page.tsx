export default function FacebookConnectorPage() {
  return (
    <div className="min-h-[80vh] py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Facebook Connector
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Facebook Integration Module
          </h2>
          
          <p className="text-gray-700 mb-6">
            The Facebook connector module is available as an npm package:
            <code className="bg-gray-100 px-2 py-1 rounded font-mono">
              @agentsocial/facebook-connector
            </code>
          </p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Credential validation</li>
                <li>Page management</li>
                <li>Post creation</li>
                <li>Insights fetching</li>
                <li>Post retrieval</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded">
              <h3 className="font-semibold text-gray-900 mb-2">Usage Example:</h3>
              <p className="text-gray-700">
                See the <code>@agentsocial/facebook-connector</code> package for 
                TypeScript definitions and usage examples.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}