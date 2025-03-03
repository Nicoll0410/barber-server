import { response, request } from "express"
class VentasController {
    get(req = request, res = response) {
        return res.json([
            {
                idVenta : 1,
                idCita : 12,
                comentarios : "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                fecha : "20/Abril/2024",
                subtotal : 150.000,
                descuento : "10%",
                total : 140.000,
            },

            {
                idVenta : 2,
                idCita : 13,
                comentarios : "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                fecha : "09/Mayo/2024",
                subtotal : 200.000,
                descuento : "15%",
                total : 195.000,
            },

            {
                idVenta : 3,
                idCita : 14,
                comentarios : "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                fecha : "14/Mayo/2024",
                subtotal : 90.000,
                descuento : "10%",
                total : 80.000,
            },

            {
                idVenta : 4,
                idCita : 15,
                comentarios : "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
                fecha : "30/Abril/2024",
                subtotal : 150.000,
                descuento : "10%",
                total : 140.000,
            },
        ])
    }

    create(req = request, res = response){
        return res.status(201).json({
            mensaje : "Venta creada correctamente"
        })
    }

    update(req = request, res = response){
        return res.json({
            mensaje : "Venta actualizada correctamente"
        })
    }

    delete(req = request, res = response){
        return res.json({
            mensaje : "Venta eliminada correctamente"
        })
    }
}

export const ventasController = new VentasController()