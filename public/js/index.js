function cerrarTodos() {
  document.getElementById("modalRegistro").style.display = "none";
  document.getElementById("modalLogin").style.display = "none";
}

function mostrarRegistro() {
  cerrarTodos();
  document.getElementById("modalRegistro").style.display = "flex";
}

function mostrarLogin() {
  cerrarTodos();
  document.getElementById("modalLogin").style.display = "flex";
}

function cerrarModal(id) {
  document.getElementById(id).style.display = "none";
}
