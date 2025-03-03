import { Sequelize } from "sequelize"
import mySQLDialect from 'mysql2'

export class Database {
    constructor() {
        this.database = null;

        (async () => {
            const { DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env

            try {
                this.database = new Sequelize({
                    username: DATABASE_USERNAME,
                    password: DATABASE_PASSWORD,
                    host: DATABASE_HOST,
                    dialect: "mysql",
                    dialectModule: mySQLDialect,
                    port: DATABASE_PORT,
                    logging: false,
                    database: DATABASE_NAME,

                })

                await this.database.authenticate()


                // Resolución de error max index keys 
                // for (let i = 2; i <= 63; i++) {
                //     await this.database.query(`ALTER TABLE roles DROP INDEX nombre_${i};`);
                // }


                console.log("\x1b[32m", "Base de datos conectada 🎉🎉🎉")
            } catch (error) {
                console.log("\x1b[31m", "Ocurrió un error conectando la base de datos")
                console.log(error.message)
            }
        })()

    }

    getDatabase() {
        return this.database;
    }
}

export const database = new Database()
export const sequelize = database.getDatabase()
