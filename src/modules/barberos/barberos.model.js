import { Model, DataTypes } from "sequelize"
import { sequelize } from "../../database.js";
import { Usuario } from "../usuarios/usuarios.model.js";
import { Rol } from "../roles/roles.model.js";
import { passwordUtils } from "../../utils/password.util.js";

export class Barbero extends Model { }

Barbero.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    cedula: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    telefono: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    direccion: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    fecha_de_contratacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    nivel_academico: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    usuarioID: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: "barbero"
})

Barbero.belongsTo(Usuario, { foreignKey: "usuarioID", onDelete: "CASCADE" })
Usuario.hasMany(Barbero, { foreignKey: "usuarioID", onDelete: "CASCADE" })

Barbero
    .sync({ alter: false })
    .then((result) => {
        console.log(result);
    })
    .catch((err) => {
        console.log(err);
    });


async function initializeAdmin() {
    try {

        await sequelize.authenticate()

        await Barbero.sync({ alter: true });

        const amount = await Barbero.count();

        if (amount > 0) return;

        const adminRole = await Rol.findOne({ where: { nombre: "Administrador" } });
        const userInfo = {
            email: "nybarber2025@gmail.com",
            password: await passwordUtils.encrypt("nybarber17"),
            estaVerificado: true,
            rolID: adminRole.id
        };

        const usuario = await Usuario.create(userInfo);

        const barberInfo = {
            nombre: "Administrador",
            avatar: null,
            cedula: 100000000,
            telefono: 100000000,
            direccion: "",
            fecha_nacimiento: "2006-08-08",
            fecha_de_contratacion: "2006-08-08",
            nivel_academico: "Profesional",
            profesion: "Administrador",
            usuarioID: usuario.id
        };

        await Barbero.create(barberInfo);

        console.log("ADMINISTRADOR CREADO");
    } catch (error) {
        console.log(error);
    }
}

// initializeAdmin()