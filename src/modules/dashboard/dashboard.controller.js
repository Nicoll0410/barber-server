import { Op, Sequelize } from 'sequelize';
import { Cita } from "../citas/citas.model.js";
import { Compra } from "../compras/compras.model.js";
import { Proveedor } from "../proveedores/proveedores.model.js";
import { Barbero } from "../barberos/barberos.model.js";
import { Usuario } from "../usuarios/usuarios.model.js";
import { Rol } from "../roles/roles.model.js";
import { Servicio } from '../servicios/servicios.model.js';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export class DashboardController {

    get = async (req, res) => {
        try {
            // Fechas para generar la lista de los últimos 8 meses
            const generateLast8Months = () => {
                const months = [];
                let date = new Date();
                for (let i = 0; i < 8; i++) {
                    months.push(format(subMonths(startOfMonth(date), i), 'yyyy-MM'));
                }
                return months.reverse();
            };

            const monthsList = generateLast8Months();
            const monthMap = {
                '01': 'Enero',
                '02': 'Febrero',
                '03': 'Marzo',
                '04': 'Abril',
                '05': 'Mayo',
                '06': 'Junio',
                '07': 'Julio',
                '08': 'Agosto',
                '09': 'Septiembre',
                '10': 'Octubre',
                '11': 'Noviembre',
                '12': 'Diciembre'
            };

            // Ventas por mes de los últimos 8 meses
            const ventasPorMesRaw = await Cita.findAll({
                attributes: [
                    [Sequelize.fn('DATE_FORMAT', Sequelize.col('fecha'), '%Y-%m'), 'x'],
                    [Sequelize.fn('sum', Sequelize.col('servicio.precio')), 'y']
                ],
                include: [{
                    model: Servicio,
                    attributes: []
                }],
                where: {
                    estado: 'Completa',
                    fecha: {
                        [Op.between]: [new Date(new Date().setFullYear(new Date().getFullYear() - 1)), new Date()]
                    }
                },
                group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('fecha'), '%Y-%m')],
                order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('fecha'), '%Y-%m'), 'DESC']],
                raw: true
            });

            // Compras por mes de los últimos 8 meses
            const comprasPorMesRaw = await Compra.findAll({
                attributes: [
                    [Sequelize.fn('DATE_FORMAT', Sequelize.col('fecha'), '%Y-%m'), 'x'],
                    [Sequelize.fn('sum', Sequelize.col('costo')), 'y']
                ],
                where: {
                    estaAnulado: false,
                    fecha: {
                        [Op.between]: [new Date(new Date().setFullYear(new Date().getFullYear() - 1)), new Date()]
                    }
                },
                group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('fecha'), '%Y-%m')],
                order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('fecha'), '%Y-%m'), 'DESC']],
                raw: true
            });

            // Mapeo de ventas y compras por mes
            const ventasPorMes = monthsList.map(month => {
                const item = ventasPorMesRaw.find(i => i.x === month) || { y: 0 };
                const [_, monthNum] = month.split('-');
                return {
                    x: monthMap[monthNum],
                    y: parseInt(item.y)
                };
            });

            const comprasPorMes = monthsList.map(month => {
                const item = comprasPorMesRaw.find(i => i.x === month) || { y: 0 };
                const [_, monthNum] = month.split('-');
                return {
                    x: monthMap[monthNum],
                    y: parseInt(item.y)
                };
            });

            // Cálculo de ventas, compras y ganancias del mes actual y del mes pasado
            const ventasEsteMes = ventasPorMes[7].y;
            const ventasLastMonth = ventasPorMes[6].y;
            const comprasEsteMes = comprasPorMes[7].y;
            const comprasLastMonth = comprasPorMes[6].y;
            const profitEsteMes = ventasEsteMes - comprasEsteMes;
            const profitLastMonth = ventasLastMonth - comprasLastMonth;

            // Cálculo de cambios porcentuales
            const calculatePercentageChange = (current, last) => {
                if (last === 0) {
                    return current === 0 ? 0 : (current > 0 ? 100 : -100);
                }
                return ((current - last) / Math.abs(last)) * 100;
            };

            const ventasChange = calculatePercentageChange(ventasEsteMes, ventasLastMonth);
            const comprasChange = calculatePercentageChange(comprasEsteMes, comprasLastMonth);
            const profitChange = calculatePercentageChange(profitEsteMes, profitLastMonth);

            console.log({ profitChange, profitEsteMes, profitLastMonth });


            // Cálculo de ganancias por mes
            const gananciasPorMes = ventasPorMes.slice(4, 8).map((venta, i) => {
                return {
                    label: venta.x,
                    id: venta.x,
                    value: venta.y - comprasPorMes[i + 4].y
                }
            });

            // Top barberos, tipos de usuarios, y top proveedores se mantienen igual
            const topBarberos = await Cita.findAll({
                attributes: [
                    'barberoID',
                    [Sequelize.fn('count', Sequelize.col('cita.id')), 'citas']
                ],
                where: {
                    estado: 'Completa'
                },
                include: [{
                    model: Barbero,
                    attributes: ['nombre', 'avatar']
                }],
                group: ['barberoID', 'barbero.id'],
                order: [[Sequelize.fn('count', Sequelize.col('cita.id')), 'DESC']],
                limit: 5
            });

            const topServicios = (await Cita.findAll({
                attributes: [
                    'servicioID',
                    [Sequelize.fn('count', Sequelize.col('cita.id')), 'citas']
                ],
                where: {
                    estado: 'Completa'
                },
                include: [{
                    model: Servicio,
                    attributes: ['nombre']
                }],
                group: ['servicioID', 'servicio.id'],
                order: [[Sequelize.fn('count', Sequelize.col('cita.id')), 'DESC']],
                limit: 8
            })).map(service => {
                const { citas, servicio } = service.dataValues;
                return { value: citas, id: servicio.nombre, label: servicio.nombre };
            });

            const topHoras = (await Cita.findAll({
                attributes: [
                    "hora",
                    [Sequelize.fn('count', Sequelize.col('cita.hora')), 'cantidad']
                ],
                group: ['cita.hora'],
                order: [['hora', 'ASC']],
                limit: 6
            })).map(date => {
                const { cantidad, hora } = date.dataValues;
                const [hours, minutes, seconds] = hora.split(':');
                let hour = parseInt(hours);
                const ampm = hour >= 12 ? 'PM' : 'AM';

                hour = hour % 12;
                hour = hour ? hour : 12;

                const completeHour = `${hour}:${minutes} ${ampm}`;
                return { value: cantidad, id: completeHour, label: completeHour };
            });

            const citasCompletadasTotales = await Cita.count({ where: { estado: "Completa" } });

            const tiposDeUsuarios = (await Usuario.findAll({
                attributes: [
                    [Sequelize.fn('count', Sequelize.col('usuario.id')), 'value'],
                    'rolID'
                ],
                include: [{
                    model: Rol,
                    attributes: ['nombre']
                }],
                group: ['rolID', 'rol.id']
            })).map(shop => {
                const { value, rol } = shop.dataValues;
                return { value, id: rol.nombre, label: rol.nombre };
            });

            const topProveedores = (await Compra.findAll({
                attributes: [
                    'proveedorID',
                    [Sequelize.fn('count', Sequelize.col('proveedor.id')), 'value']
                ],
                include: [{
                    model: Proveedor,
                    attributes: ['nombre'],
                    as: "proveedor",
                }],
                group: ['proveedorID', 'proveedor.id'],
                order: [[Sequelize.fn('count', Sequelize.col('proveedor.id')), 'DESC']],
                limit: 7
            })).map(provider => {
                const { value, proveedor } = provider.dataValues;
                return { value, id: proveedor.nombre, label: proveedor.nombre };
            });



            return res.json({
                ventasEsteMes,
                comprasEsteMes,
                profitEsteMes,
                ventasPorMes,
                topBarberos,
                tiposDeUsuarios,
                topProveedores,
                citasCompletadasTotales,
                ventasChange,
                topHoras,
                comprasChange,
                profitChange,
                comprasPorMes,
                gananciasPorMes,
                topServicios
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

}

export const dashboardController = new DashboardController();
