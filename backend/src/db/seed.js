import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './connection.js';
import { runMigrations } from './migrate.js';
import { hashPassword } from '../utils/password.js';

const SEED_PASSWORD = 'Password123';

/** Sample users spread across countries, genders, statuses and creation dates. */
const SAMPLE_USERS = [
  ['Aisha', 'Rahman', 'aisha.rahman@example.com', '+91 98450 11223', '1995-04-12', 'Female', '14 Brigade Road', 'Bengaluru', 'India', 'Active', 0],
  ['Daniel', 'Okonkwo', 'daniel.okonkwo@example.com', '+234 802 551 7788', '1990-11-03', 'Male', '22 Awolowo Way', 'Lagos', 'Nigeria', 'Active', 4],
  ['Marta', 'Kowalski', 'marta.kowalski@example.com', '+48 601 223 118', '1988-02-27', 'Female', 'ul. Dluga 18', 'Warsaw', 'Poland', 'Inactive', 9],
  ['Chen', 'Wei', 'chen.wei@example.com', '+86 138 0013 8000', '1993-07-19', 'Male', '88 Nanjing Road', 'Shanghai', 'China', 'Active', 13],
  ['Sofia', 'Alvarez', 'sofia.alvarez@example.com', '+34 612 445 990', '1997-09-08', 'Female', 'Calle Gran Via 45', 'Madrid', 'Spain', 'Active', 18],
  ['James', 'Whitfield', 'james.whitfield@example.com', '+44 7700 900321', '1985-01-30', 'Male', '9 Kingsway', 'London', 'United Kingdom', 'Inactive', 24],
  ['Priya', 'Nair', 'priya.nair@example.com', '+91 99620 44557', '1996-06-15', 'Female', '5 Marine Drive', 'Kochi', 'India', 'Active', 29],
  ['Lucas', 'Moreau', 'lucas.moreau@example.com', '+33 6 12 34 56 78', '1991-12-05', 'Male', '17 Rue de Rivoli', 'Paris', 'France', 'Active', 34],
  ['Fatima', 'Al Mansouri', 'fatima.almansouri@example.com', '+971 50 663 2211', '1994-03-21', 'Female', 'Sheikh Zayed Road 120', 'Dubai', 'United Arab Emirates', 'Active', 38],
  ['Noah', 'Bergstrom', 'noah.bergstrom@example.com', '+46 70 555 2143', '1989-08-11', 'Male', 'Vasagatan 7', 'Stockholm', 'Sweden', 'Inactive', 43],
  ['Yuki', 'Tanaka', 'yuki.tanaka@example.com', '+81 90 1234 5678', '1998-05-02', 'Female', '3-2-1 Shibuya', 'Tokyo', 'Japan', 'Active', 47],
  ['Omar', 'Haddad', 'omar.haddad@example.com', '+20 100 774 2210', '1992-10-17', 'Male', '12 Tahrir Square', 'Cairo', 'Egypt', 'Active', 52],
  ['Elena', 'Petrova', 'elena.petrova@example.com', '+49 151 2233 4455', '1987-04-25', 'Female', 'Torstrasse 62', 'Berlin', 'Germany', 'Inactive', 57],
  ['Michael', 'Anderson', 'michael.anderson@example.com', '+1 415 555 0142', '1986-09-14', 'Male', '450 Market Street', 'San Francisco', 'United States', 'Active', 61],
  ['Grace', 'Mwangi', 'grace.mwangi@example.com', '+254 722 118 440', '1999-01-09', 'Female', 'Ngong Road 88', 'Nairobi', 'Kenya', 'Active', 66],
  ['Rahul', 'Sharma', 'rahul.sharma@example.com', '+91 98110 77220', '1994-07-28', 'Male', '21 Connaught Place', 'New Delhi', 'India', 'Active', 70],
  ['Isabella', 'Rossi', 'isabella.rossi@example.com', '+39 333 445 7788', '1993-11-16', 'Female', 'Via Montenapoleone 4', 'Milan', 'Italy', 'Inactive', 75],
  ['Alex', 'Ferreira', 'alex.ferreira@example.com', '+55 11 98877 1122', '1995-02-06', 'Other', 'Av. Paulista 1500', 'Sao Paulo', 'Brazil', 'Active', 80],
  ['Thomas', 'Dubois', 'thomas.dubois@example.com', '+32 470 22 33 44', '1990-06-23', 'Male', 'Rue Neuve 31', 'Brussels', 'Belgium', 'Active', 84],
  ['Hannah', 'Schmidt', 'hannah.schmidt@example.com', '+43 664 123 4567', '1997-12-01', 'Female', 'Karntner Strasse 10', 'Vienna', 'Austria', 'Active', 89],
  ['Ibrahim', 'Diallo', 'ibrahim.diallo@example.com', '+221 77 445 8899', '1991-03-18', 'Male', 'Avenue Bourguiba 55', 'Dakar', 'Senegal', 'Inactive', 93],
  ['Mei', 'Lin', 'mei.lin@example.com', '+65 8123 4567', '1996-08-30', 'Female', '10 Orchard Road', 'Singapore', 'Singapore', 'Active', 98],
  ['Carlos', 'Mendoza', 'carlos.mendoza@example.com', '+52 55 1234 5678', '1988-05-11', 'Male', 'Av. Reforma 222', 'Mexico City', 'Mexico', 'Active', 102],
  ['Zara', 'Khan', 'zara.khan@example.com', '+92 300 445 6677', '1998-10-24', 'Female', 'Mall Road 76', 'Lahore', 'Pakistan', 'Active', 107],
  ['Peter', 'Novak', 'peter.novak@example.com', '+420 601 334 556', '1992-01-13', 'Male', 'Wenceslas Square 12', 'Prague', 'Czechia', 'Inactive', 112],
  ['Amara', 'Osei', 'amara.osei@example.com', '+233 24 556 7788', '1999-09-05', 'Female', 'Oxford Street 40', 'Accra', 'Ghana', 'Active', 116],
];

function daysAgoIso(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

export async function seed({ force = false } = {}) {
  runMigrations();
  const db = getDb();

  const { total } = db.prepare('SELECT COUNT(*) AS total FROM users').get();
  if (total > 0 && !force) {
    console.log(`Skipping seed — the users table already holds ${total} row(s). Use "npm run seed -- --force" to replace them.`);
    return { inserted: 0, skipped: true };
  }

  if (force) {
    db.prepare('DELETE FROM users').run();
    db.prepare("DELETE FROM sqlite_sequence WHERE name = 'users'").run();
  }

  const insert = db.prepare(
    `INSERT INTO users
       (first_name, last_name, email, password, phone_number, date_of_birth,
        gender, address, city, country, status, created_date, updated_date)
     VALUES
       (@first_name, @last_name, @email, @password, @phone_number, @date_of_birth,
        @gender, @address, @city, @country, @status, @created_date, @updated_date)`,
  );

  const records = [];
  for (const row of SAMPLE_USERS) {
    const [first_name, last_name, email, phone_number, date_of_birth, gender, address, city, country, status, ageInDays] = row;
    const createdDate = daysAgoIso(ageInDays);

    records.push({
      first_name,
      last_name,
      email,
      password: await hashPassword(SEED_PASSWORD),
      phone_number,
      date_of_birth,
      gender,
      address,
      city,
      country,
      status,
      created_date: createdDate,
      // Give a few users a later update so updated_date is visibly distinct.
      updated_date: ageInDays > 60 ? daysAgoIso(Math.floor(ageInDays / 2)) : createdDate,
    });
  }

  const insertMany = db.transaction((rows) => {
    for (const record of rows) insert.run(record);
  });
  insertMany(records);

  return { inserted: records.length, skipped: false };
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const force = process.argv.includes('--force');
  const { inserted, skipped } = await seed({ force });
  if (!skipped) {
    console.log(`Seeded ${inserted} users. Every seeded account uses the password "${SEED_PASSWORD}".`);
  }
}
