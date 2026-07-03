import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, VendorStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    companyName: string;
    taxId?: string;
    contactName: string;
    contactEmail: string;
    phone?: string;
    address?: string;
    userId?: string;
  }) {
    let userId = data.userId;

    // If no userId provided, create a user account automatically
    if (!userId) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.contactEmail },
      });
      if (existingUser) {
        throw new ConflictException('A user with this email already exists');
      }

      const password = crypto.randomBytes(8).toString('hex');
      const passwordHash = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: data.contactEmail,
          passwordHash,
          fullName: data.contactName,
          role: 'VENDOR',
        },
      });
      userId = user.id;
    }

    return this.prisma.vendor.create({
      data: {
        companyName: data.companyName,
        taxId: data.taxId,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        phone: data.phone,
        address: data.address,
        userId,
      },
    });
  }

  async findAll(page = 1, limit = 20, search?: string, status?: string) {
    const where: Prisma.VendorWhereInput = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status as VendorStatus;

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendor.count({ where }),
    ]);
    return {
      data: vendors,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { user: { select: { email: true, fullName: true } } },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(
    id: string,
    data: {
      companyName?: string;
      taxId?: string;
      contactName?: string;
      contactEmail?: string;
      phone?: string;
      address?: string;
      status?: VendorStatus;
    },
  ) {
    return this.prisma.vendor.update({ where: { id }, data });
  }

  async remove(id: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    return this.prisma.vendor.update({
      where: { id },
      data: { status: 'INACTIVE' as any },
    });
  }

  async selfRegister(data: {
    email: string;
    password: string;
    fullName: string;
    companyName: string;
    taxId?: string;
    phone?: string;
    address?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser)
      throw new ConflictException('A user with this email already exists');

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        role: 'VENDOR',
        isActive: false,
      },
    });

    const vendor = await this.prisma.vendor.create({
      data: {
        companyName: data.companyName,
        taxId: data.taxId,
        contactName: data.fullName,
        contactEmail: data.email,
        phone: data.phone,
        address: data.address,
        userId: user.id,
        status: 'PENDING_APPROVAL',
      },
    });

    return {
      message: 'Registration submitted for approval',
      vendorId: vendor.id,
    };
  }

  async approve(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    await this.prisma.user.update({
      where: { id: vendor.userId },
      data: { isActive: true },
    });

    return this.prisma.vendor.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }

  async reject(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');

    await this.prisma.user.update({
      where: { id: vendor.userId },
      data: { isActive: false },
    });

    return this.prisma.vendor.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
