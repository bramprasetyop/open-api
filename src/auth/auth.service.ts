import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@src/core/service/logger/logger.service';
import axios from 'axios';
import { Cache } from 'cache-manager';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import { SESSION_PREFIX } from 'src/core/constants';

dotenv.config();

@Injectable()
export class AuthService {
  private readonly apiUrl = 'http://localhost:3001/api/v1/';

  constructor(
    private readonly logger: LoggerService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheService: Cache
  ) {}

  public async login(payload) {
    const { username, password } = payload;

    try {
      const passwordMD5 = crypto
        .createHash('md5')
        .update(password)
        .digest('hex');

      // Verify user credentials
      this.logger.log(
        'Validate user login to core data. User: ',
        JSON.stringify({ email: username })
      );
      const response = await axios.post(`${this.apiUrl}/auth/login`, {
        username,
        password: passwordMD5
      });
      if (response) {
        this.logger.log(
          'User login success, generate user token...',
          JSON.stringify(response)
        );
      }
      // End of Verify user credentials

      const userData = response.data;

      // Get user 'info-polis'
      this.logger.log(
        'Get user info-polis. User: ',
        JSON.stringify({ email: username })
      );
      const policyInfo = await axios.post(`${this.apiUrl}/polis/info-peserta`, {
        no_polis: userData.data.no_polis,
        no_peserta: userData.data.no_peserta
      });
      if (policyInfo) {
        this.logger.log(
          'User info-polis retrieved...',
          JSON.stringify(policyInfo)
        );
      }

      // Generate user token
      const token = await this.createToken({
        id: userData.data.id_user,
        username
      });

      // Save token session to redis
      this.cacheService.set(
        `${SESSION_PREFIX}${userData['data'].id_user}`,
        userData.data,
        +process.env.TOKEN_EXPIRATION
      );

      return {
        token: token,
        ...userData.data,
        policyInfo: policyInfo.data.data
      };
    } catch (error) {
      this.logger.error(
        '===== Error while login user =====',
        `User ${username} login attempt failed. Detail: `,
        JSON.stringify(error, null, 2)
      );
      // error instanceof UnauthorizedException
      throw new UnauthorizedException(
        'Email atau Kata Sandi Tidak Cocok. Mohon Periksa Kembali.'
      );
    }
  }

  async createToken(payload) {
    return await this.jwtService.signAsync(payload, {
      expiresIn: process.env.TOKEN_EXPIRATION
    });
  }
}
