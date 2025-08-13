
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Hash para as senhas
  const hashedPassword = await bcrypt.hash('johndoe123', 10)
  const hashedPassword2 = await bcrypt.hash('password123', 10)

  // Limpar dados existentes
  await prisma.signature.deleteMany()
  await prisma.document.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  // Criar usuários de teste
  const adminUser = await prisma.user.create({
    data: {
      id: 'admin-user-id',
      name: 'John Doe',
      email: 'john@doe.com',
      password: hashedPassword,
      role: 'admin',
      emailVerified: new Date(),
    }
  })

  // Criar usuários sequencialmente para evitar muitas conexões
  const userData = [
    { name: 'Maria Silva', email: 'maria.silva@empresa.com', role: 'manager' },
    { name: 'João Santos', email: 'joao.santos@empresa.com', role: 'user' },
    { name: 'Ana Costa', email: 'ana.costa@empresa.com', role: 'user' },
    { name: 'Pedro Oliveira', email: 'pedro.oliveira@empresa.com', role: 'manager' },
    { name: 'Carla Ferreira', email: 'carla.ferreira@empresa.com', role: 'user' },
    { name: 'Lucas Rodrigues', email: 'lucas.rodrigues@empresa.com', role: 'user' },
    { name: 'Fernanda Lima', email: 'fernanda.lima@empresa.com', role: 'manager' },
    { name: 'Roberto Alves', email: 'roberto.alves@empresa.com', role: 'user' },
  ]

  const users = []
  for (const user of userData) {
    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword2,
        role: user.role,
        emailVerified: new Date(),
      }
    })
    users.push(createdUser)
  }

  // Criar alguns documentos de exemplo
  const document1 = await prisma.document.create({
    data: {
      name: 'Contrato de Prestação de Serviços',
      description: 'Contrato para desenvolvimento de sistema',
      filePath: '/uploads/contrato-001.pdf',
      status: 'pending',
      userId: adminUser.id,
    }
  })

  const document2 = await prisma.document.create({
    data: {
      name: 'Acordo de Confidencialidade',
      description: 'NDA para projeto estratégico',
      filePath: '/uploads/nda-002.pdf',
      status: 'completed',
      userId: users[0].id,
    }
  })

  // Criar algumas assinaturas de exemplo
  await prisma.signature.create({
    data: {
      documentId: document1.id,
      userId: users[0].id,
      status: 'pending',
      order: 1,
    }
  })

  await prisma.signature.create({
    data: {
      documentId: document1.id,
      userId: users[1].id,
      status: 'pending',
      order: 2,
    }
  })

  await prisma.signature.create({
    data: {
      documentId: document2.id,
      userId: users[2].id,
      status: 'signed',
      signedAt: new Date(),
      order: 1,
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log(`👤 Created ${users.length + 1} users`)
  console.log(`📄 Created 2 documents`)
  console.log(`✍️ Created 3 signatures`)
  console.log('')
  console.log('🔐 Test credentials:')
  console.log('   Email: john@doe.com')
  console.log('   Password: johndoe123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
