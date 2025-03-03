import { request, response } from "express";
import { jwt } from "../utils/jwt.util.js";


class JWTMiddlewares {
    verifyToken(req = request, res = response, next) {
        const protectedRoutes = ['/proveedores', '/ventas', '/roles', '/citas', '/insumos', '/barberos', '/servicios', '/clientes', '/compras', '/usuarios', '/categorias-insumos', "/movimientos", "/dashboard"];
        if (!protectedRoutes.find(route => req.path.startsWith(route))) return res.status(404).json({ mensaje: "¿Estás perdido? No pudimos encontrar este endpoint" });

        const authHeader = req.header("Authorization")
        if (!authHeader) return res.status(401).json({ mensaje: "¡Ups! Parece que no tienes una sesión activa" })
        if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ mensaje: "Formato del token invalido" })
        const token = authHeader.split(' ')[1];

        const esTokenValido = jwt.isTokenValid(token)
        if (!esTokenValido) return res.status(401).json({ mensaje: "Token no válido" })

        next()
    }
}

export const jwtMiddlewares = new JWTMiddlewares()