import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  status: 'ok';
  service: string;
  time: string;
}

/** Health-check для оркестратора/балансировщика. Без авторизации. */
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return {
      status: 'ok',
      service: 'bogatyrskiy-boost',
      time: new Date().toISOString(),
    };
  }
}
