import { PrismaClient } from './generated/prisma-client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminExists = await prisma.user.findFirst({ where: { isAdmin: true } })
  if (adminExists) {
    console.log('Seed data already exists, skipping...')
    return
  }

  const company = await prisma.company.create({
    data: { name: 'BizForce CRM' }
  })

  const admin = await prisma.user.create({
    data: {
      userName: 'admin',
      email: 'admin@bizforce.online',
      firstName: 'Admin',
      lastName: 'User',
      password: await bcrypt.hash('admin123', 10),
      isAdmin: true,
      isActive: true,
      timezone: 'Asia/Karachi',
      language: 'en_us',
      companyId: company.id,
      profile: {
        create: { isSuperAdmin: true }
      }
    }
  })

  const modules = [
    { name: 'dashboard', label: 'Dashboard', parent: '', sequence: 0, isEntity: false, icon: 'LayoutDashboard' },
    { name: 'campaigns', label: 'Campaigns', parent: 'Marketing', sequence: 1, icon: 'Megaphone' },
    { name: 'leads', label: 'Leads', parent: 'Marketing', sequence: 2, icon: 'UserPlus' },
    { name: 'accounts', label: 'Accounts', parent: 'Marketing', sequence: 3, icon: 'Building2' },
    { name: 'contacts', label: 'Contacts', parent: 'Marketing', sequence: 4, icon: 'Users' },
    { name: 'potentials', label: 'Opportunities', parent: 'Sales', sequence: 5, icon: 'TrendingUp' },
    { name: 'quotes', label: 'Quotes', parent: 'Sales', sequence: 6, icon: 'FileText' },
    { name: 'salesorders', label: 'Sales Orders', parent: 'Sales', sequence: 7, icon: 'ShoppingCart' },
    { name: 'invoices', label: 'Invoices', parent: 'Sales', sequence: 8, icon: 'Receipt' },
    { name: 'products', label: 'Products', parent: 'Inventory', sequence: 9, icon: 'Package' },
    { name: 'services', label: 'Services', parent: 'Inventory', sequence: 10, icon: 'Wrench' },
    { name: 'pricebooks', label: 'Price Books', parent: 'Inventory', sequence: 11, icon: 'BookOpen' },
    { name: 'vendors', label: 'Vendors', parent: 'Inventory', sequence: 12, icon: 'Truck' },
    { name: 'purchaseorders', label: 'Purchase Orders', parent: 'Inventory', sequence: 13, icon: 'ClipboardList' },
    { name: 'tickets', label: 'Tickets', parent: 'Support', sequence: 14, icon: 'LifeBuoy' },
    { name: 'faq', label: 'FAQ', parent: 'Support', sequence: 15, icon: 'HelpCircle' },
    { name: 'servicecontracts', label: 'Service Contracts', parent: 'Support', sequence: 16, icon: 'FileSignature' },
    { name: 'assets', label: 'Assets', parent: 'Support', sequence: 17, icon: 'HardDrive' },
    { name: 'projects', label: 'Projects', parent: 'Projects', sequence: 18, icon: 'FolderKanban' },
    { name: 'projecttasks', label: 'Project Tasks', parent: 'Projects', sequence: 19, icon: 'CheckSquare' },
    { name: 'projectmilestones', label: 'Project Milestones', parent: 'Projects', sequence: 20, icon: 'Flag' },
    { name: 'documents', label: 'Documents', parent: 'Tools', sequence: 21, icon: 'File' },
    { name: 'emailtemplates', label: 'Email Templates', parent: 'Tools', sequence: 22, icon: 'FileText' },
    { name: 'emails', label: 'Emails', parent: 'Tools', sequence: 23, icon: 'Mail' },
    { name: 'smsnotifier', label: 'SMS Notifier', parent: 'Sales', sequence: 24, icon: 'MessageSquare' },
    { name: 'settings', label: 'Settings', parent: '', sequence: 99, isEntity: false, icon: 'Settings' },
  ]

  for (const mod of modules) {
    await prisma.module.create({ data: mod as any })
  }

  await prisma.currency.create({
    data: { name: 'US Dollar', code: 'USD', symbol: '$', isDefault: true, isActive: true, rate: 1 }
  })
  await prisma.currency.create({
    data: { name: 'Pakistani Rupee', code: 'PKR', symbol: 'Rs', isDefault: false, isActive: false, rate: 280 }
  })
  await prisma.currency.create({
    data: { name: 'Euro', code: 'EUR', symbol: '€', isDefault: false, isActive: false, rate: 0.92 }
  })

  await prisma.sequenceNumber.create({
    data: { moduleName: 'accounts', prefix: 'ACC', currentNo: 1, digitWidth: 4 }
  })
  await prisma.sequenceNumber.create({
    data: { moduleName: 'contacts', prefix: 'CON', currentNo: 1, digitWidth: 4 }
  })
  await prisma.sequenceNumber.create({
    data: { moduleName: 'leads', prefix: 'LEA', currentNo: 1, digitWidth: 4 }
  })
  await prisma.sequenceNumber.create({
    data: { moduleName: 'potentials', prefix: 'POT', currentNo: 1, digitWidth: 4 }
  })
  await prisma.sequenceNumber.create({
    data: { moduleName: 'invoices', prefix: 'INV', currentNo: 1, digitWidth: 4 }
  })
  await prisma.sequenceNumber.create({
    data: { moduleName: 'quotes', prefix: 'QUO', currentNo: 1, digitWidth: 4 }
  })
  await prisma.sequenceNumber.create({
    data: { moduleName: 'projects', prefix: 'PRO', currentNo: 1, digitWidth: 4 }
  })

  console.log('Seed completed successfully!')
  console.log('Admin user: admin@bizforce.online / admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
