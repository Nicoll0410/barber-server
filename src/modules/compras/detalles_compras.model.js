import { Model, DataTypes } from "sequelize"
import { sequelize } from "../../database.js";
import { Compra } from "./compras.model.js";
import { Insumo } from "../insumos/insumos.model.js";


export class DetalleCompra extends Model { }

DetalleCompra.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    precio_unitario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    compraID: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    insumoID: {
        type: DataTypes.UUID,
        allowNull: false,
    },

}, {
    sequelize,
    modelName: "detalle_compra"
})

DetalleCompra.belongsTo(Compra, { foreignKey: "compraID", onDelete: "CASCADE" })
DetalleCompra.belongsTo(Insumo, { foreignKey: "insumoID", onDelete: "CASCADE" })
Compra.hasMany(DetalleCompra, { foreignKey: "compraID" })



DetalleCompra
    .sync({ alter: false })
    .then((result) => {
        console.log(result);
    })
    .catch((err) => {
        console.log(err);
    });
