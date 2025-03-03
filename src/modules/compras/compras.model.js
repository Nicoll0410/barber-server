import { Model, DataTypes } from "sequelize"
import { sequelize } from "../../database.js";
import { Proveedor } from "../proveedores/proveedores.model.js";


export class Compra extends Model { }

Compra.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    metodo_pago: {
        type: DataTypes.ENUM('Efectivo', 'Transferencia'),
        allowNull: false,
    },
    costo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    proveedorID: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    estaAnulado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }

}, {
    sequelize,
    modelName: "compra"
})

Compra.belongsTo(Proveedor, { foreignKey: "proveedorID", as: "proveedor" })


Compra
    .sync({ alter: false })
    .then((result) => {
        console.log(result);
    })
    .catch((err) => {
        console.log(err);
    });
