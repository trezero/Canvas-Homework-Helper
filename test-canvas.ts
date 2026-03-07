import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const tokenMatch = env.match(/CANVAS_API_TOKEN=(.*)/);
const token = tokenMatch ? tokenMatch[1].trim() : '';

if (!token) {
  console.error('\n❌ ERROR: Please put your CANVAS_API_TOKEN in the .env file and save it before running this script!\n');
  process.exit(1);
}

const url = 'https://pasadena.instructure.com/api/v1/courses/62367/assignments/1741271?include[]=submission';

async function fetchAssignment() {
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json+canvas-string-ids'
      }
    });
    
    if (!res.ok) {
        console.error(`Error: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.error(text);
        process.exit(1);
    }
    
    const data = await res.json();
    fs.writeFileSync('.canvas_test_response.json', JSON.stringify(data, null, 2));
    console.log('✅ Success! Assignment response saved to .canvas_test_response.json');
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

fetchAssignment();
