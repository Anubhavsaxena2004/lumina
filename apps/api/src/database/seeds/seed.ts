import { Pool } from 'pg';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';

dotenv.config();

async function runSeed() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres123@localhost:5432/kumkum_payal';

  console.log(`Connecting to database for seeding: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
  const pool = new Pool({ connectionString });

  try {
    await pool.query('SELECT 1');
    console.log('✓ Connected to PostgreSQL');

    // 1. One OWNER user
    const ownerPassword = await argon2.hash('owner123');
    const ownerId = '11111111-1111-1111-1111-111111111111';
    await pool.query(
      `
      INSERT INTO users (id, name, username, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, 'OWNER', true)
      ON CONFLICT (username) DO UPDATE
      SET name = EXCLUDED.name, role = 'OWNER', is_active = true;
    `,
      [ownerId, 'Mihir Sharma (Owner)', 'mihir', ownerPassword],
    );
    console.log('✓ Seeded OWNER user (username: mihir)');

    // 2. A few items
    const items = [
      { id: 'aaaaaaaa-1111-0000-0000-000000000001', name: 'Gold Ornaments 22K', category: 'Gold Ornaments' },
      { id: 'aaaaaaaa-1111-0000-0000-000000000002', name: 'Silver Payal 92.5', category: 'Silver Ornaments' },
      { id: 'aaaaaaaa-1111-0000-0000-000000000003', name: 'Silver Bangles 80T', category: 'Silver Ornaments' },
      { id: 'aaaaaaaa-1111-0000-0000-000000000004', name: 'Loose Cubic Zirconia', category: 'Stones' },
    ];
    for (const item of items) {
      await pool.query(
        `
        INSERT INTO items (id, name, category, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (name) DO NOTHING;
      `,
        [item.id, item.name, item.category],
      );
    }
    console.log(`✓ Seeded ${items.length} inventory items`);

    // 3. Two parties
    const parties = [
      {
        id: 'cccccccc-1111-0000-0000-000000000001',
        name: 'Rajasthan Jewellers',
        type: 'CUSTOMER',
        whatsapp: '+919829012345',
        address: 'Johri Bazaar, Jaipur',
        opening_balance: 125000.0,
      },
      {
        id: 'cccccccc-1111-0000-0000-000000000002',
        name: 'Mehta Gold Works',
        type: 'SUPPLIER',
        whatsapp: '+919829054321',
        address: 'Sarafa Bazaar, Meerut',
        opening_balance: -75000.0,
      },
    ];
    for (const party of parties) {
      await pool.query(
        `
        INSERT INTO parties (id, name, type, whatsapp_number, address, opening_balance, created_by, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        ON CONFLICT DO NOTHING;
      `,
        [party.id, party.name, party.type, party.whatsapp, party.address, party.opening_balance, ownerId],
      );
    }
    console.log(`✓ Seeded ${parties.length} parties (Customer & Supplier)`);

    // 4. One bank account
    await pool.query(
      `
      INSERT INTO bank_accounts (id, name, opening_balance, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT DO NOTHING;
    `,
      ['bbbbbbbb-1111-0000-0000-000000000001', 'HDFC Bank - Current A/C (..4012)', 450000.0],
    );
    console.log('✓ Seeded primary bank account');

    // 5. Reminder settings row
    await pool.query(
      `
      INSERT INTO reminder_settings (id, repeat_days, send_time, owner_whatsapp, is_active)
      VALUES (1, 3, '10:00', '+919690000000', true)
      ON CONFLICT (id) DO UPDATE
      SET repeat_days = EXCLUDED.repeat_days, send_time = EXCLUDED.send_time, owner_whatsapp = EXCLUDED.owner_whatsapp;
    `,
    );
    console.log('✓ Seeded reminder_settings single row configuration');

    console.log('Database seeding finished successfully!');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSeed();
