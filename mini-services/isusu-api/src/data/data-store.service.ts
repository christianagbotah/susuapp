import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { buildSeed } from './seed';
import { ApiUser, Wallet, Txn, SusuGroup, Contribution, Loan, ApiNotification } from './types';

/**
 * In-memory data store — the single source of truth for the demo API.
 * In production this is swapped for Prisma/TypeORM repositories
 * (repository pattern keeps module services unchanged).
 */
@Injectable()
export class DataStoreService {
  users: ApiUser[] = [];
  wallets: Wallet[] = [];
  transactions: Txn[] = [];
  susuGroups: SusuGroup[] = [];
  contributions: Contribution[] = [];
  loans: Loan[] = [];
  notifications: ApiNotification[] = [];
  private counter = 1000;

  constructor() {
    Object.assign(this, buildSeed());
  }

  nextId(prefix: string): string {
    this.counter += 1;
    return `${prefix}-${this.counter}`;
  }

  generateReference(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ref = '';
    for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
    return `ISP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${ref}`;
  }

  findUserByPhone(phone: string): ApiUser | undefined {
    return this.users.find((u) => u.phone === phone);
  }

  findUserById(id: string): ApiUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  sanitizeUser(user: ApiUser): Omit<ApiUser, 'passwordHash'> {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  getWallets(userId: string): Wallet[] {
    return this.wallets.filter((w) => w.userId === userId);
  }

  mainWallet(userId: string): Wallet {
    const w = this.wallets.find((x) => x.userId === userId && x.type === 'main');
    if (!w) throw new NotFoundException('Main wallet not found');
    return w;
  }

  debit(userId: string, amount: number, txn: Omit<Txn, 'id' | 'userId' | 'balanceAfter' | 'currency' | 'status' | 'date'>): Txn {
    const wallet = this.mainWallet(userId);
    if (wallet.balance < amount) {
      throw new BadRequestException(`Insufficient funds. Balance: ₵${wallet.balance.toFixed(2)}, requested: ₵${amount.toFixed(2)}`);
    }
    wallet.balance = Math.round((wallet.balance - amount) * 100) / 100;
    const record: Txn = {
      id: this.nextId('txn'),
      userId,
      currency: 'GHS',
      status: 'completed',
      date: new Date().toISOString(),
      balanceAfter: wallet.balance,
      ...txn,
    };
    this.transactions.unshift(record);
    return record;
  }

  credit(userId: string, amount: number, txn: Omit<Txn, 'id' | 'userId' | 'balanceAfter' | 'currency' | 'status' | 'date'>): Txn {
    const wallet = this.mainWallet(userId);
    wallet.balance = Math.round((wallet.balance + amount) * 100) / 100;
    const record: Txn = {
      id: this.nextId('txn'),
      userId,
      currency: 'GHS',
      status: 'completed',
      date: new Date().toISOString(),
      balanceAfter: wallet.balance,
      ...txn,
    };
    this.transactions.unshift(record);
    return record;
  }
}
