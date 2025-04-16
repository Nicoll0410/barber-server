import { Model, DataTypes } from "sequelize"
import { sequelize } from "../../database.js";
import { Insumo } from '../insumos/insumos.model.js';


export class Movimiento extends Model { }

Movimiento.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    insumoID: {
        type: DataTypes.UUID,
        allowNull: false,
    },

}, {
    sequelize,
    modelName: "movimiento"
})
