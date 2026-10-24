import { Controller, Get } from '@nestjs/common';
import { PROVINCIAS } from '../common/provinces.js';

@Controller('geo')
export class GeoController {
  @Get('provincias')
  provincias() {
    return PROVINCIAS;
  }
}
