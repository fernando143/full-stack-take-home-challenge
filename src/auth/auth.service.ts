import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(email);

    if (!user) throw new UnauthorizedException('Invalid email or password');

    const passwordMatch = await argon2.verify(user.password, password);

    if (!passwordMatch)
      throw new UnauthorizedException('Invalid email or password');

    const payload = { sub: user.id, email: user.email };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }

  async register({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<void> {
    const hashedPassword = await argon2.hash(password);
    await this.usersService.registerOne(email, hashedPassword);
  }
}
