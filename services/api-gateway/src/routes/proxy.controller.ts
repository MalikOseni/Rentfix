import { Controller, All, Req, Res, BadRequestException, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';
import { AccessTokenGuard } from '../shared/guards/access-token.guard';

@Controller('api')
export class ProxyController {
  private readonly upstreams = {
    auth: process.env.UPSTREAM_AUTH_URL || 'http://core-auth:4100',
    tickets: process.env.UPSTREAM_TICKETS_URL || 'http://core-tickets:4300',
    matching: process.env.UPSTREAM_MATCHING_URL || 'http://core-matching:4400',
    notifications: process.env.UPSTREAM_NOTIFICATIONS_URL || 'http://core-notifications:4500'
  };

  @All('health')
  health() {
    return {
      status: 'ok',
      service: 'api-gateway',
      upstreams: Object.keys(this.upstreams)
    };
  }

  @All('/auth/:path(*)')
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res, this.upstreams.auth, req.params.path);
  }

  @All('/tickets/:path(*)')
  @UseGuards(AccessTokenGuard)
  async proxyTickets(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res, this.upstreams.tickets, req.params.path);
  }

  @All('/match/:path(*)')
  @UseGuards(AccessTokenGuard)
  async proxyMatching(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res, this.upstreams.matching, req.params.path);
  }

  @All('/notify/:path(*)')
  @UseGuards(AccessTokenGuard)
  async proxyNotifications(@Req() req: Request, @Res() res: Response) {
    return this.proxy(req, res, this.upstreams.notifications, req.params.path);
  }

  private async proxy(
    req: Request,
    res: Response,
    baseUrl: string,
    path: string
  ): Promise<void> {
    try {
      const url = `${baseUrl}/${path}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;
      const response = await axios({
        method: req.method.toLowerCase() as any,
        url,
        data: req.method !== 'GET' ? req.body : undefined,
        headers: this.stripHopHeaders(req.headers),
        validateStatus: () => true // Don't throw on any status
      });

      Object.entries(this.stripHopHeaders(response.headers as any)).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      res.status(response.status).send(response.data);
    } catch (error) {
      console.error(`Proxy error for ${baseUrl}/${path}:`, error);
      res.status(502).json({
        statusCode: 502,
        message: 'Bad Gateway',
        error: (error as Error).message
      });
    }
  }

  private stripHopHeaders(headers: any): Record<string, any> {
    const hopByHopHeaders = [
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailers',
      'transfer-encoding',
      'upgrade'
    ];

    const cleaned: Record<string, any> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (!hopByHopHeaders.includes(key.toLowerCase())) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
}