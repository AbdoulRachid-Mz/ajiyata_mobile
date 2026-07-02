import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../../drizzle/migrations';

const expoDb = SQLite.openDatabaseSync('ajiya.db');

// Export pour une utilisation directe
export const db = drizzle(expoDb, { schema });

// Hook de migration pour l'application
export const useDatabaseMigrations = () => {
  return useMigrations(db, migrations);
};

export type { schema };