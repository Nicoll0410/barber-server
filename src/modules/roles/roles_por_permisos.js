import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../database.js";
import { Rol } from "./roles.model.js";
import { Permiso } from "./permisos.model.js";

export class RolesPorPermisos extends Model { }

RolesPorPermisos.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    rolID: {
        type: DataTypes.UUID,
        allowNull: false
    },
    permisoID: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    sequelize,
    modelName: "rolesPorPermiso",
    tableName: "roles_por_permisos"
});

// Definir las relaciones
RolesPorPermisos.belongsTo(Rol, { foreignKey: "rolID" });
RolesPorPermisos.belongsTo(Permiso, { foreignKey: "permisoID" });

Rol.hasMany(RolesPorPermisos, { foreignKey: "rolID" });
Permiso.hasMany(RolesPorPermisos, { foreignKey: "permisoID" });

async function initializeRolesPorPermisos() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        await RolesPorPermisos.sync({ alter: true });
        console.log('RolesPorPermisos table synced successfully.');

        const admin = await Rol.findOne({ where: { nombre: "Administrador" } });
        const barbero = await Rol.findOne({ where: { nombre: "Barbero" } });

        if (!admin || !barbero) {
            throw new Error('Required roles not found in the database.');
        }

        const permissionsUnformatted = await Permiso.findAll();
        const amount = await RolesPorPermisos.count();

        const adminPermissions = permissionsUnformatted.filter(({ nombre }) => nombre != "Mis Citas").map(permission => ({
            rolID: admin.id,
            permisoID: permission.id
        }));


        const barberPermissions = permissionsUnformatted
            .filter(({ nombre }) => ["Servicios", "Pacientes", "Insumos", "Movimientos", "Control de Insumos", "Mis Citas"].includes(nombre))
            .map(permission => ({
                rolID: barbero.id,
                permisoID: permission.id
            }));

        if (amount === 0) {
            await RolesPorPermisos.bulkCreate([...adminPermissions, ...barberPermissions]);
            console.log('RolesPorPermisos initialized successfully.');
        }
    } catch (error) {
        console.error('Error initializing RolesPorPermisos:', error);
    }
}

// initializeRolesPorPermisos();
