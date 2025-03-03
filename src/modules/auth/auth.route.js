import { Router } from "express";
import { authController } from "./auth.controller.js";
import { validaciones } from "../../middlewares/validaciones.middleware.js";
export const authRouter = Router()



authRouter.post("/login", authValidaciones(), authController.login)
authRouter.post("/login-client", authValidaciones(), authController.loginClient)
authRouter.post("/login-mobile", authValidaciones(), authController.loginMobile)
authRouter.post("/signup", authValidaciones(), authController.signUp)

authRouter.post("/verify-account", verifyTokenValidaciones(), authController.verifyAccount)

authRouter.get("/verify-token", validaciones.estaHeaderVacio("Authorization", "El token es obligatorio"), authController.verifyToken)


authRouter.get("/routes-permission", validaciones.estaHeaderVacio("Authorization", "El token es obligatorio"), authController.routesPermission)

authRouter.post("/recover-password", recoverPasswordValidaciones(), authController.recoverPassword)
authRouter.post("/verify-recover-password", verifyRecoverPasswordValidaciones(), authController.verifyRecoverPassword)



function authValidaciones() {
    return [
        validaciones.estaVacio("email", "El email es un campo obligatorio"),
        validaciones.esEmail("email", "El email no tiene el formato correcto"),
        validaciones.estaVacio("password", "La contraseña es un campo obligatorio"),
    ]
}
function verifyTokenValidaciones() {
    return [
        validaciones.estaVacio("email", "El email es obligatorio"),
        validaciones.esEmail("email", "El email no tiene el formato correcto"),
        validaciones.estaVacio("codigo", "El código de verificación es obligatorio"),
    ]
}


function recoverPasswordValidaciones() {
    return [
        validaciones.estaVacio("email", "El email es obligatorio"),
        validaciones.esEmail("email", "El email no tiene el formato correcto"),
    ]
}

function verifyRecoverPasswordValidaciones() {
    return [
        validaciones.estaVacio("email", "El email es obligatorio"),
        validaciones.esEmail("email", "El email no tiene el formato correcto"),
        validaciones.estaVacio("codigo", "El codigo es obligatorio"),
        validaciones.estaVacio("password", "El password es obligatorio"),
    ]
}