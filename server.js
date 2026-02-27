const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id TEXT PRIMARY KEY,
      estado_general TEXT,
      usuario JSONB,
      fecha_registro TEXT
    )
  `);
  console.log("Base de datos lista");
}

initDB();

app.post('/api/register', async (req, res) => {
  try {
    const { usuario } = req.body;

    if (!usuario || !usuario.correo) {
      return res.status(400).json({ message: "Datos incompletos" });
    }

    const existe = await pool.query(
      "SELECT * FROM clientes WHERE usuario->>'correo' = $1",
      [usuario.correo]
    );

    if (existe.rows.length > 0) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const newClient = {
      id: "CLI-" + Date.now(),
      estado_general: "activo",
      usuario,
      fecha_registro: new Date().toISOString()
    };

    await pool.query(
      "INSERT INTO clientes (id, estado_general, usuario, fecha_registro) VALUES ($1,$2,$3,$4)",
      [newClient.id, newClient.estado_general, newClient.usuario, newClient.fecha_registro]
    );

    res.json({ message: "Usuario registrado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
