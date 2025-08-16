import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
import path from 'path'

// Load env variables from root .env.local
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') })

const connectionUri = process.env.DATABASE_URL as string

if (!connectionUri) {
  throw new Error('❌ DATABASE_URL is missing in environment variables')
}

export const sequelize = new Sequelize(connectionUri, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
})

export async function initializeDatabase() {
  try {
    await sequelize.authenticate()
    console.log('✅ Database connected successfully')

    await import('../models')

    await sequelize.sync({ alter: false })
    console.log('✅ Database synchronized')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}
