// Test script to verify admin authentication and routing
const testAdminAuth = async () => {
  console.log('Testing admin authentication...');
  
  // Test admin login
  try {
    const loginResponse = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'rowdycup2025'
      }),
      credentials: 'include'
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginResponse.ok) {
      console.log('✅ Admin login successful');
      
      // Test protected endpoint access
      const protectedResponse = await fetch('http://localhost:3000/admin/rounds', {
        credentials: 'include'
      });
      
      if (protectedResponse.ok) {
        console.log('✅ Admin can access protected endpoints');
      } else {
        console.log('❌ Admin cannot access protected endpoints');
      }
      
      // Test user info endpoint
      const userResponse = await fetch('http://localhost:3000/auth/me', {
        credentials: 'include'
      });
      
      const userData = await userResponse.json();
      console.log('User data:', userData);
      
      if (userData.role === 'admin') {
        console.log('✅ Admin role verified');
      } else {
        console.log('❌ Admin role not verified');
      }
      
    } else {
      console.log('❌ Admin login failed');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testAdminAuth();
