import path from 'path';
import dotenv from 'dotenv';

// Carrega o .env da raiz do projeto, independente de onde o teste é executado
dotenv.config({ path: path.join(__dirname, '.env') });

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}. Confira o arquivo .env (veja .env.example).`);
  }
  return value;
}

export type QueuePerson = { searchTerm: string; displayName: string };

/**
 * Lê QUEUE_USERS no formato:
 *   termoDeBusca:Nome Completo;termoDeBusca:Nome Completo
 */
function parseQueueUsers(raw: string): QueuePerson[] {
  const people = raw
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const idx = entry.indexOf(':');
      if (idx <= 0) {
        throw new Error(`QUEUE_USERS inválido em "${entry}". Use o formato termo:Nome Completo`);
      }
      return {
        searchTerm: entry.slice(0, idx).trim(),
        displayName: entry.slice(idx + 1).trim(),
      };
    });

  if (people.length === 0) {
    throw new Error('QUEUE_USERS está vazio.');
  }
  return people;
}

export const env = {
  get loginUrl() {
    return required('CRM_LOGIN_URL');
  },
  get email() {
    return required('CRM_EMAIL');
  },
  get password() {
    return required('CRM_PASSWORD');
  },
  get dashboardUrl() {
    return required('CRM_DASHBOARD_URL');
  },
  get queueUsers() {
    return parseQueueUsers(required('QUEUE_USERS'));
  },
};

export const AUTH_FILE = path.join(__dirname, 'prod', '.auth', 'session.json');
