// apps/api/src/auth/auth.service.ts
import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, full_name } = registerDto;

    // 1. Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // 2. Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Obtener el rol de "user"
    const userRole = await this.prisma.role.findUnique({ where: { name: 'user' } });
    if (!userRole) {
      // Esto no debería pasar si la siembra se ejecutó correctamente
      throw new InternalServerErrorException('User role not found. Please contact support.');
    }

    // 4. Crear el nuevo usuario
    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        full_name,
        role_id: userRole.id,
      },
    });

    // Por seguridad, no devolvemos el hash de la contraseña
    const { password_hash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email: loginDto.email } });
    if (!user || !(await bcrypt.compare(loginDto.password, user.password_hash))) {
        throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

}