import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { VendorSelfRegisterDto, VendorCreateDto, VendorUpdateDto } from './dto/vendor.dto';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorController {
  constructor(private vendorService: VendorService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Public vendor self-registration' })
  async selfRegister(@Body() body: VendorSelfRegisterDto) {
    return this.vendorService.selfRegister(body);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve pending vendor' })
  approve(@Param('id') id: string) {
    return this.vendorService.approve(id);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject pending vendor' })
  reject(@Param('id') id: string) {
    return this.vendorService.reject(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.PROCUREMENT)
  @ApiOperation({ summary: 'Register a new vendor' })
  create(@Body() body: VendorCreateDto) {
    return this.vendorService.create(body);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.PROCUREMENT)
  @ApiOperation({ summary: 'List all vendors' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.vendorService.findAll(page || 1, limit || 20, search, status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PROCUREMENT)
  @ApiOperation({ summary: 'Get vendor by ID' })
  findOne(@Param('id') id: string) {
    return this.vendorService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.PROCUREMENT)
  @ApiOperation({ summary: 'Update vendor' })
  update(@Param('id') id: string, @Body() body: VendorUpdateDto) {
    return this.vendorService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete vendor' })
  remove(@Param('id') id: string) {
    return this.vendorService.remove(id);
  }
}
