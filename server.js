const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const dbPath = path.join(__dirname, 'data', 'clientes.json');

function readDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

app.post('/api/register', (req, res) => {
  const clientes = readDB();
  const newClient = {
    id: "CLI-" + Date.now(),
    estado_general: "en_proceso",
    ...req.body
  };
  clientes.push(newClient);
  writeDB(clientes);
  res.json({ message: "Cliente registrado correctamente", client: newClient });
});

app.get('/api/clientes', (req, res) => {
  const clientes = readDB();
  res.json(clientes);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
