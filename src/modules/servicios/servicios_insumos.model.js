import { Model, DataTypes } from "sequelize"
import { sequelize } from "../../database.js";
import { Insumo } from "../insumos/insumos.model.js";
import { Servicio } from "./servicios.model.js";


export class ServiciosPorInsumos extends Model { }

ServiciosPorInsumos.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    servicioID: {
        type: DataTypes.UUID,
        allowNull: false
    },
    insumoID: {
        type: DataTypes.UUID,
        allowNull: false
    },
    unidades: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    modelName: "servicios_por_insumo"
})


ServiciosPorInsumos.belongsTo(Servicio, { foreignKey: "servicioID" })
ServiciosPorInsumos.belongsTo(Insumo, { foreignKey: "insumoID" })

ServiciosPorInsumos
    .sync({ alter:  false })
    .then((result) => {
        console.log(result);
    })
    .catch((err) => {
        console.log(err);
    });
