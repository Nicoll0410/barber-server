import jsonwebtoken from "jsonwebtoken"

class JWT {
    createToken(email) {
        const token = jsonwebtoken.sign({ email }, process.env.JWT_SECRET)
        return token;
    }

    isTokenValid(token) {
        try {
            jsonwebtoken.verify(token, process.env.JWT_SECRET)
            return true;
        } catch (error) {
            return false;
        }
    }
}

export const jwt = new JWT() 