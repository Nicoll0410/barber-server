import { Model, DataTypes } from "sequelize";
import { sequelize } from "../../database.js";

export class Rol extends Model {}

Rol.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "https://i.postimg.cc/mDK0yP6M/svgviewer-png-output.png"
    },
    esEditable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: "rol",
    tableName: "roles",
    hooks: {
        beforeValidate(rol) {
            if (!rol.avatar) rol.avatar = "https://i.postimg.cc/mDK0yP6M/svgviewer-png-output.png";
        }
    }
});

async function initializeRoles() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const rolesCount = await Rol.count();
        if (rolesCount > 0) return;

        await Rol.bulkCreate([
            {
                nombre: 'Administrador',
                descripcion: 'Administrador del sistema',
                avatar: 'https://i.postimg.cc/mDK0yP6M/svgviewer-png-output.png',
                esEditable: false,
                createdAt: "2034-06-22 19:24:33"
            },
            {
                nombre: 'Barbero',
                descripcion: 'Barbero del centro de belleza',
                avatar: 'https://i.postimg.cc/vBtg4Ywf/peluqueria.png',
                esEditable: false,
                createdAt: "2034-06-22 19:24:33"
            },
            {
                nombre: 'Paciente',
                descripcion: 'Cliente de la barberia',
                avatar: 'https://i.postimg.cc/HLgRSJH1/svgviewer-png-output-1.png',
                esEditable: false,
                createdAt: "2034-06-22 19:24:33"
            }
        ]);
        console.log('Roles inicializados correctamente');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

// initializeRoles();
