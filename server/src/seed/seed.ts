import bcrypt from 'bcryptjs'
import { User } from '../models/user'
import { Auction } from '../models/auction'
import { initializeDatabase, sequelize } from '../config/db'

async function seed() {
  try {
    await initializeDatabase()

    // Clean existing data (optional, for dev)
    await sequelize.sync({ force: true }) // 🚨 WARNING: deletes all tables/data, remove in production

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10)

    const seller = await User.create({
      name: 'John Seller',
      email: 'seller@example.com',
      passwordHash: hashedPassword,
      role: 'USER'
    })

    const bidder = await User.create({
      name: 'Jane Bidder',
      email: 'bidder@example.com',
      passwordHash: hashedPassword,
      role: 'USER'
    })

    // Create sample auction
    const goLiveAt = new Date()
    goLiveAt.setMinutes(goLiveAt.getMinutes() + 5) // Start in 5 minutes

    await Auction.create({
      sellerId: seller.id,
      title: 'Vintage Guitar',
      description: 'A beautiful vintage acoustic guitar from the 1960s in excellent condition.',
      startingPrice: 500,
      bidIncrement: 25,
      goLiveAt,
      durationMinutes: 30,
      status: 'SCHEDULED'
    })

    console.log('✅ Seed data created successfully')
    console.log('Seller: seller@example.com / password123')
    console.log('Bidder: bidder@example.com / password123')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
