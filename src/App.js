import React from 'react';
import CalendarGenerator from './components/CalendarGenerator';

function App() {
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6 text-center">集合地點發送裝置</h1>
      <CalendarGenerator />
    </div>
  );
}

export default App;
