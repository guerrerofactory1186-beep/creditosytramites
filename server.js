app.post('/api/register', (req, res) => {
  const clientes = readDB();

  const { usuario } = req.body;

  // Validar si ya existe el correo
  const existe = clientes.find(c => c.usuario?.correo === usuario.correo);
  if (existe) {
    return res.status(400).json({ message: "El correo ya está registrado" });
  }

  const newClient = {
    id: "CLI-" + Date.now(),
    estado_general: "activo",
    usuario,
    fecha_registro: new Date().toISOString()
  };

  clientes.push(newClient);
  writeDB(clientes);

  res.json({ message: "Usuario registrado correctamente" });
});
