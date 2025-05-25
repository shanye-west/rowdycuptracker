import React from 'react';
import { useAuth } from '../lib/auth';
import { Link } from 'wouter';

export default function AdminTest() {
  const { profile, isAuthenticated, isAdmin, login, logout } = useAuth();

  const handleLogin = async () => {
    const result = await login('admin', 'rowdycup2025');
    console.log('Login result:', result);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Authentication Test</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Is Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Profile:</strong> {profile ? JSON.stringify(profile, null, 2) : 'None'}</p>
      </div>

      <div className="space-x-2 mb-4">
        <button 
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Login as Admin
        </button>
        <button 
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Test Admin Routing (should redirect if admin):</h2>
        <div className="space-x-2">
          <Link href="/" className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
            Go to Home
          </Link>
          <Link href="/teams" className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
            Go to Teams
          </Link>
          <Link href="/rounds/6" className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
            Go to Round 1
          </Link>
          <Link href="/admin" className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600">
            Go to Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
