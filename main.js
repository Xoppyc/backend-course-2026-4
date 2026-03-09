import fs from 'fs';
import { parseArgs } from 'node:util';
import { xmlBuilder } from './xmlBuilder.js';
import { createApp } from 'minip';

// ─── Argument Setup ────────────────────────────────────────────────────────────

const options = {
  input: { type: 'string', short: 'i' },
  host: { type: 'string', short: 'h', default: 'localhost' },
  port: { type: 'string', short: 'p', default: '8080' },
};

const { values } = parseArgs({ options });

if (!values.input) {
  console.error('Error: --input (-i) is required.');
  process.exit(1);
}

const PORT = Number(values.port);
const HOST = values.host;

// ─── In-memory store ───────────────────────────────────────────────────────────

const houseStore = [];

// ─── Raw body reader ───────────────────────────────────────────────────────────

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk.toString()));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ─── Server Setup ─────────────────────────────────────────────────────────────

const { router, listen } = createApp({ port: PORT, host: HOST });

// ─── Routes ───────────────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  res.status(200).json({ message: 'server is up, no problem here' });
});

router.post('/upload', async (req, res) => {
  const xmlData = await readRawBody(req);
  const house = parseHouseFromXml(xmlData);
  houseStore.push(house);
  res.status(201).xml(xmlData);
});

router.get('/lookup', (req, res) => {
  const { furnished, max_price } = req.query;

  let results = [...houseStore];

  console.log(results[0]);
  if (furnished !== undefined && furnished !== 'true') {
    results = results.filter(
      (h) =>
        h.furnishingstatus !== undefined && h.furnishingstatus === 'furnished',
    );
  }
  console.log(results[0]);
  if (max_price !== undefined) {
    const maxPrice = Number(max_price);
    if (!isNaN(maxPrice)) {
      results = results.filter(
        (h) => h.price !== undefined && h.price <= maxPrice,
      );
    }
  }
  console.log(results[0]);
  const xmlData = xmlBuilder(results);
  console.log(xmlData.slice(0, 100));
  res.status(200).xml(xmlData);
});

// ─── XML → Object helper ───────────────────────────────────────────────────────

function parseHouseFromXml(xml) {
  const get = (tag) => {
    const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return match?.[1];
  };

  const house = {};

  const price = get('price');
  if (price !== undefined) house.price = Number(price);

  const furnishingstatus = get('furnishingstatus');
  if (furnishingstatus !== undefined) house.furnishingstatus = furnishingstatus;

  const area = get('area');
  if (area !== undefined) house.area = Number(area);

  return house;
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

async function dispatch(filePath) {
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const lines = rawData.split('\n').filter((line) => line.trim() !== '');

  console.log(`Starting dispatch of ${lines.length} items...`);

  for (const line of lines) {
    try {
      console.log('starting..');
      const house = JSON.parse(line);
      house && console.log('parsed..');
      const xml = xmlBuilder([house]);
      xml && console.log('xml built..');
      console.log(xml);
      console.log('sending request..');
      const response = await fetch(`http://${HOST}:${PORT}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xml,
      });
      if (!response.ok) {
        console.error(
          `Upload failed for line: ${line} — status ${response.status} ${response.statusText}`,
        );
      } else {
        console.log(
          `Upload succeeded for line: ${lines.indexOf(line) + 1} - status ${response.status} ${response.statusText}`,
        );
      }
    } catch (e) {
      console.error('Error processing line:', e);
    }
  }

  console.log('All items dispatched.');
}

// ─── Start ────────────────────────────────────────────────────────────────────

listen(() => {
  console.log(`Server listening at http://${HOST}:${PORT}`);
  dispatch(values.input);
});
