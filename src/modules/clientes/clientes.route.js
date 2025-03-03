import { Router } from "express";
import { clientesController } from "./clientes.controller.js";
import { validaciones } from "../../middlewares/validaciones.middleware.js";


export const clientesRouter = Router()


clientesRouter.get("/", clientesController.get)
clientesRouter.post("/",
    [
        validaciones.estaVacio("nombre", "El nombre debe de ser obligatorio", { max: 50 }),
        validaciones.estaVacio("telefono", "El teléfono debe de ser obligatorio", { max: 10, esNumerico: true }),
        validaciones.estaVacio("fecha_nacimiento", "La fecha de nacimiento debe de ser obligatoria"),
    ],
    clientesController.create)

clientesRouter.put("/by-email",
    [
        validaciones.estaVacio("nombre", "El nombre debe de ser obligatorio"),
        validaciones.estaVacio("telefono", "El teléfono debe de ser obligatorio"),
        validaciones.estaVacio("fecha_nacimiento", "La fecha de nacimiento debe de ser obligatoria"),
        validaciones.estaVacio("email", "El email debe de ser obligatoria"),
    ],
    clientesController.updateByEmail)

clientesRouter.put("/:id",
    [
        validaciones.estaVacio("nombre", "El nombre debe de ser obligatorio"),
        validaciones.estaVacio("telefono", "El teléfono debe de ser obligatorio"),
        validaciones.estaVacio("fecha_nacimiento", "La fecha de nacimiento debe de ser obligatoria"),
    ],
    clientesController.update)



clientesRouter.delete("/:id", clientesController.delete)