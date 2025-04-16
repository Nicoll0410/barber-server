import { sequelize } from "./database.js";

// MODELOS
import { Rol } from "./modules/roles/roles.model.js";
import { Permiso } from "./modules/roles/permisos.model.js";
import { Usuario } from "./modules/usuarios/usuarios.model.js";
import { CodigosVerificacion } from "./modules/usuarios/codigos_verificacion.model.js";
import { CodigosRecuperarVerificacion } from "./modules/usuarios/codigos_recuperar_password.model.js";
import { RolesPorPermisos } from "./modules/roles/roles_por_permisos.js";

import { Cliente } from "./modules/clientes/clientes.model.js";
import { Barbero } from "./modules/barberos/barberos.model.js";

import { CategoriaProducto } from "./modules/categoria-insumos/categoria_insumos.model.js";
import { Insumo } from "./modules/insumos/insumos.model.js";
import { Movimiento } from "./modules/movimientos/movimientos.model.js";

import { Proveedor } from "./modules/proveedores/proveedores.model.js";
import { Compra } from "./modules/compras/compras.model.js";
import { DetalleCompra } from "./modules/compras/detalles_compras.model.js";

import { Servicio } from "./modules/servicios/servicios.model.js";
import { ServiciosPorInsumos } from "./modules/servicios/servicios_insumos.model.js";

import { Cita } from "./modules/citas/citas.model.js";

// RELACIONES
Usuario.belongsTo(Rol, { foreignKey: "rolID" });
Rol.hasMany(Usuario, { foreignKey: "rolID" });

Cliente.belongsTo(Usuario, { foreignKey: "usuarioID" });
Usuario.hasMany(Cliente, { foreignKey: "usuarioID", as: "cliente" });

Barbero.belongsTo(Usuario, { foreignKey: "usuarioID", onDelete: "CASCADE" });
Usuario.hasMany(Barbero, { foreignKey: "usuarioID", onDelete: "CASCADE" });

CodigosVerificacion.belongsTo(Usuario, { foreignKey: "usuarioID", onDelete: "CASCADE" })
CodigosRecuperarVerificacion.belongsTo(Usuario, { foreignKey: "usuarioID" })

Compra.belongsTo(Proveedor, { foreignKey: "proveedorID", as: "proveedor" })
Proveedor.hasMany(Compra, { foreignKey: "proveedorID" });

DetalleCompra.belongsTo(Compra, { foreignKey: "compraID", onDelete: "CASCADE" })
DetalleCompra.belongsTo(Insumo, { foreignKey: "insumoID", onDelete: "CASCADE" })

Compra.hasMany(DetalleCompra, { foreignKey: "compraID" })

Movimiento.belongsTo(Insumo, { foreignKey: "insumoID", onDelete: "CASCADE", as: "insumo" })

ServiciosPorInsumos.belongsTo(Servicio, { foreignKey: "servicioID" });
ServiciosPorInsumos.belongsTo(Insumo, { foreignKey: "insumoID" });

Servicio.hasMany(Cita, { foreignKey: "servicioID" })
Barbero.hasMany(Cita, { foreignKey: "barberoID" })
Cliente.hasMany(Cita, { foreignKey: "pacienteID" })

Insumo.belongsTo(CategoriaProducto, { foreignKey: "categoriaID" })
CategoriaProducto.hasMany(Insumo, { foreignKey: "categoriaID" });

RolesPorPermisos.belongsTo(Rol, { foreignKey: "rolID" });
RolesPorPermisos.belongsTo(Permiso, { foreignKey: "permisoID" });
Rol.hasMany(RolesPorPermisos, { foreignKey: "rolID" });
Permiso.hasMany(RolesPorPermisos, { foreignKey: "permisoID" });

Cita.belongsTo(Cliente, { foreignKey: "pacienteID" });
Cita.belongsTo(Barbero, { foreignKey: "barberoID" });
Cita.belongsTo(Servicio, { foreignKey: "servicioID" });

// SYNC
export async function syncAllModels() {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Base de datos sincronizada correctamente");
  } catch (err) {
    console.error("❌ Error al sincronizar:", err);
  }
}
