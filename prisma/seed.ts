import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // --- Regions ---
    const regionNames = [
        'Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet',
        'Rangpur', 'Barishal', 'Mymensingh', 'Comilla', 'Gazipur',
    ];
    const regions = await Promise.all(
        regionNames.map((name) =>
            prisma.region.upsert({
                where: { name },
                update: {},
                create: { name },
            }),
        ),
    );
    console.log(`✅ Created ${regions.length} regions`);

    // --- Areas (5 per region = 50 total) ---
    const areaNames = [
        'North', 'South', 'East', 'West', 'Central',
    ];
    const areas: any[] = [];
    for (const region of regions) {
        for (const suffix of areaNames) {
            const name = `${region.name} ${suffix}`;
            const area = await prisma.area.upsert({
                where: { id: areas.length + 1 },
                update: {},
                create: { name, regionId: region.id },
            });
            areas.push(area);
        }
    }
    console.log(`✅ Created ${areas.length} areas`);

    // --- Distributors ---
    const distNames = [
        'Alpha Distribution', 'Beta Supplies', 'Gamma Trading', 'Delta Logistics',
        'Epsilon Commerce', 'Zeta Wholesale', 'Eta Partners', 'Theta Enterprises',
        'Iota Distribution', 'Kappa Trading Co', 'Lambda Supplies', 'Mu Logistics',
        'Nu Commerce', 'Xi Wholesale', 'Omicron Partners', 'Pi Enterprises',
        'Rho Distribution', 'Sigma Trading', 'Tau Supplies', 'Upsilon Logistics',
    ];
    const distributors = await Promise.all(
        distNames.map((name) =>
            prisma.distributor.upsert({
                where: { name },
                update: {},
                create: { name },
            }),
        ),
    );
    console.log(`✅ Created ${distributors.length} distributors`);

    // --- Territories (2 per area = 100 total) ---
    const territories: any[] = [];
    for (const area of areas) {
        for (let i = 1; i <= 2; i++) {
            const name = `${area.name} Zone-${i}`;
            const territory = await prisma.territory.upsert({
                where: { id: territories.length + 1 },
                update: {},
                create: { name, areaId: area.id },
            });
            territories.push(territory);
        }
    }
    console.log(`✅ Created ${territories.length} territories`);

    // --- Retailers (1000 for demo) ---
    const retailerData: any[] = [];
    for (let i = 1; i <= 1000; i++) {
        const region = regions[i % regions.length];
        const area = areas[i % areas.length];
        const distributor = distributors[i % distributors.length];
        const territory = territories[i % territories.length];

        retailerData.push({
            uid: `RTL-${String(i).padStart(6, '0')}`,
            name: `Retailer ${i}`,
            phone: `+8801${String(700000000 + i).padStart(9, '0')}`,
            regionId: region.id,
            areaId: area.id,
            distributorId: distributor.id,
            territoryId: territory.id,
            points: Math.floor(Math.random() * 500),
            routes: `Route-${String.fromCharCode(65 + (i % 26))}`,
        });
    }

    await prisma.retailer.createMany({
        data: retailerData,
        skipDuplicates: true,
    });
    console.log(`✅ Created 1000 retailers`);

    // --- Users: Admin + SRs ---
    const passwordHash = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            name: 'System Admin',
            phone: '+8801700000000',
            passwordHash,
            role: UserRole.ADMIN,
        },
    });
    console.log(`✅ Created admin user: admin / password123`);

    const srData = [
        { username: 'sr1', name: 'Rahim Ahmed', phone: '+8801711111111' },
        { username: 'sr2', name: 'Karim Hasan', phone: '+8801722222222' },
        { username: 'sr3', name: 'Jamal Uddin', phone: '+8801733333333' },
        { username: 'sr4', name: 'Salma Begum', phone: '+8801744444444' },
        { username: 'sr5', name: 'Nusrat Jahan', phone: '+8801755555555' },
    ];

    const salesReps: any[] = [];
    for (const sr of srData) {
        const user = await prisma.user.upsert({
            where: { username: sr.username },
            update: {},
            create: { ...sr, passwordHash, role: UserRole.SR },
        });
        salesReps.push(user);
    }
    console.log(`✅ Created ${salesReps.length} sales reps (password: password123)`);

    // --- Assignments (~70 retailers per SR) ---
    const allRetailers = await prisma.retailer.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
    });

    let assignmentCount = 0;
    for (let srIdx = 0; srIdx < salesReps.length; srIdx++) {
        const sr = salesReps[srIdx];
        // Each SR gets ~70 retailers from a round-robin distribution
        // Some overlap is fine — the unique constraint with skipDuplicates handles it
        const start = srIdx * 70;
        const assignedRetailerIds = allRetailers
            .slice(start, start + 70)
            .map((r) => r.id);

        if (assignedRetailerIds.length > 0) {
            const result = await prisma.salesRepRetailer.createMany({
                data: assignedRetailerIds.map((retailerId) => ({
                    salesRepId: sr.id,
                    retailerId,
                })),
                skipDuplicates: true,
            });
            assignmentCount += result.count;
        }
    }
    console.log(`✅ Created ${assignmentCount} SR-retailer assignments`);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('  Admin: admin / password123');
    console.log('  SRs:   sr1-sr5 / password123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
