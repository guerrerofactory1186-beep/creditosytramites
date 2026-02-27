const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDB() {

  // Usuarios (login + rol)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      correo TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT DEFAULT 'cliente',
      creado_en TIMESTAMP DEFAULT NOW()
    )
  `);

  // Perfil del cliente
  await pool.query(`
    CREATE TABLE IF NOT EXISTS perfiles (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      direccion TEXT,
      ciudad TEXT,
      telefono TEXT,
      tipo TEXT,
      pagaduria TEXT,
      ingresos NUMERIC,
      reportado BOOLEAN DEFAULT false,
      estado TEXT DEFAULT 'prospecto'
    )
  `);

  // Documentos
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documentos (
      id SERIAL PRIMARY KEY,
      usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
      tipo_documento TEXT,
      archivo_url TEXT,
      estado TEXT DEFAULT 'pendiente',
      subido_en TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log("Base de datos lista");
}

initDB();


// =========================
// REGISTRO
// =========================

app.post('/api/register', async (req, res) => {
  try {
    const { correo, password } = req.body;

    const nuevoUsuario = await pool.query(
      "INSERT INTO usuarios (correo, password) VALUES ($1,$2) RETURNING id",
      [correo, password]
    );

    const usuario_id = nuevoUsuario.rows[0].id;

    await pool.query(
      "INSERT INTO perfiles (usuario_id) VALUES ($1)",
      [usuario_id]
    );

    res.json({ message: "Usuario registrado correctamente" });

  } catch (error) {
    res.status(400).json({ message: "Correo ya registrado" });
  }
});


// =========================
// PERFILADO PASO 1 - PERSONAL
// =========================

app.put('/api/perfil/personal/:id', async (req, res) => {
  const { id } = req.params;
  const { direccion, ciudad, telefono } = req.body;

  await pool.query(
    `UPDATE perfiles 
     SET direccion=$1, ciudad=$2, telefono=$3 
     WHERE usuario_id=$4`,
    [direccion, ciudad, telefono, id]
  );

  res.json({ message: "Información personal guardada" });
});


// =========================
// PERFILADO PASO 2 - LABORAL
// =========================

app.put('/api/perfil/laboral/:id', async (req, res) => {
  const { id } = req.params;
  const { tipo, pagaduria } = req.body;

  await pool.query(
    `UPDATE perfiles 
     SET tipo=$1, pagaduria=$2 
     WHERE usuario_id=$3`,
    [tipo, pagaduria, id]
  );

  res.json({ message: "Información laboral guardada" });
});


// =========================
// PERFILADO PASO 3 - FINANCIERO
// =========================

app.put('/api/perfil/financiero/:id', async (req, res) => {
  const { id } = req.params;
  const { ingresos } = req.body;

  await pool.query(
    `UPDATE perfiles 
     SET ingresos=$1, estado='perfilado' 
     WHERE usuario_id=$2`,
    [ingresos, id]
  );

  res.json({ message: "Perfil completo" });
});


// =========================
// SUBIR DOCUMENTO
// =========================

app.post('/api/documentos/:id', async (req, res) => {
  const { id } = req.params;
  const { tipo_documento, archivo_url } = req.body;

  await pool.query(
    `INSERT INTO documentos (usuario_id, tipo_documento, archivo_url)
     VALUES ($1,$2,$3)`,
    [id, tipo_documento, archivo_url]
  );

  await pool.query(
    `UPDATE perfiles SET estado='pendiente_documentos'
     WHERE usuario_id=$1`,
    [id]
  );

  res.json({ message: "Documento enviado" });
});


// =========================
// PANEL ADMIN - VER CLIENTES
// =========================

app.get('/api/admin/clientes', async (req, res) => {

  const clientes = await pool.query(`
    SELECT usuarios.id, usuarios.correo, perfiles.estado, perfiles.tipo
    FROM usuarios
    JOIN perfiles ON perfiles.usuario_id = usuarios.id
    ORDER BY usuarios.creado_en DESC
  `);

  res.json(clientes.rows);
});


// =========================
// APROBAR CLIENTE
// =========================

app.put('/api/admin/aprobar/:id', async (req, res) => {

  const { id } = req.params;

  await pool.query(
    `UPDATE perfiles SET estado='aprobado'
     WHERE usuario_id=$1`,
    [id]
  );

  res.json({ message: "Cliente aprobado" });
});


// =========================
// RECHAZAR CLIENTE
// =========================

app.put('/api/admin/rechazar/:id', async (req, res) => {

  const { id } = req.params;

  await pool.query(
    `UPDATE perfiles SET estado='rechazado'
     WHERE usuario_id=$1`,
    [id]
  );

  res.json({ message: "Cliente rechazado" });
});


// =========================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
