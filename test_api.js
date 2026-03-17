// Test script to check what the production-records API returns

async function testProductionAPI() {
  try {
    console.log('Testing /api/production-records endpoint...');
    
    const response = await fetch('http://localhost:9002/api/production-records');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('API Response status:', response.status);
    console.log('Number of records returned:', data.length);
    
    if (data.length > 0) {
      console.log('First record keys:', Object.keys(data[0]));
      console.log('First record sample:', data[0]);
      
      // Check if it's production or embalaje data
      const hasProductionFields = 'fechaproduccion' in data[0] || 'fechaProduccion' in data[0];
      const hasEmbalajeFields = 'presentacion' in data[0] || 'nivel_inspeccion' in data[0];
      
      console.log('Has production fields:', hasProductionFields);
      console.log('Has embalaje fields:', hasEmbalajeFields);
      
      if (hasEmbalajeFields && !hasProductionFields) {
        console.error('❌ ERROR: API is returning embalaje records instead of production records!');
      } else if (hasProductionFields && !hasEmbalajeFields) {
        console.log('✅ API is correctly returning production records');
      } else {
        console.log('⚠️  Mixed or unknown record types');
      }
    } else {
      console.log('No records returned');
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

// Run the test
testProductionAPI();
