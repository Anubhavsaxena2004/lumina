import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { Public, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

class LoginDto {
  username: string;
  password: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with username and password, setting secure httpOnly cookies' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.username, body.password);
    const tokens = await this.authService.login(user);

    // Set HTTP-only secure cookies
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 mins
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return tokens;
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and obtain new access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokens = await this.authService.refreshToken(token);

    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return tokens;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out and invalidate session cookies' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    return { success: true, message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiOperation({ summary: 'Retrieve currently logged in user profile and role' })
  getProfile(@CurrentUser() user: AuthUser) {
    return user;
  }
}
