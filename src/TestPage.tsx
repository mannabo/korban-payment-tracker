import React from 'react';

export const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-green-800 mb-4">
          Tailwind CSS Test
        </h1>
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Test Card</h2>
          <p className="text-gray-600 mb-4">
            This is a test to check if Tailwind CSS is working properly.
          </p>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Test Button
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">Grid Item 1</h3>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">Grid Item 2</h3>
          </div>
        </div>
      </div>
    </div>
  );
};