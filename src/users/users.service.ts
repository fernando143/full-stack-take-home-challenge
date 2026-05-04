import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { DatabaseErrorHandler } from 'src/common/exceptions/database-error.handler';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private userRepository: Repository<User>,
    private dbErrorHandler: DatabaseErrorHandler,
  ) {}

  async findOne(email: string): Promise<User | null> {
    return this.userRepository
      .findOne({ where: { email } })
      .catch((err) => this.dbErrorHandler.handleError(err));
  }

  async registerOne(email: string, password: string): Promise<void> {
    await this.userRepository
      .insert({ email, password })
      .catch((err) => this.dbErrorHandler.handleError(err));
  }
}
