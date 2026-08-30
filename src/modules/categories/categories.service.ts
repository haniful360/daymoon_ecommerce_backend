import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoryQueryDto, CreateCategoryDto, UpdateCategoryDto } from './dto';
import { PaginationMetaDto } from '../../common/dto';

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultCategories();
  }

  private async seedDefaultCategories() {
    const rootCount = await this.prisma.category.count();
    if (rootCount > 0) return;

    const defaultCategories = [
      {
        name: 'Electronics & PCB Assembly',
        slug: 'electronics-pcb-assembly',
        description: 'Printed circuit boards, IoT hardware, microcontrollers, and electronic manufacturing services.',
        level: 1,
      },
      {
        name: 'Industrial Machinery & Equipment',
        slug: 'industrial-machinery-equipment',
        description: 'CNC machines, injection molding, laser cutting, and automation components.',
        level: 1,
      },
      {
        name: 'Apparel, Fabrics & Textiles',
        slug: 'apparel-fabrics-textiles',
        description: 'Wholesale garments, custom uniform manufacturing, raw fabrics, and OEM fashion.',
        level: 1,
      },
      {
        name: 'Packaging, Printing & Paper',
        slug: 'packaging-printing-paper',
        description: 'Corrugated cartons, custom gift boxes, eco-friendly food packaging, and labels.',
        level: 1,
      },
      {
        name: 'Hardware, Tools & Construction',
        slug: 'hardware-tools-construction',
        description: 'Fasteners, hand tools, power tools, sanitary ware, and metal fabrication.',
        level: 1,
      },
    ];

    for (const cat of defaultCategories) {
      await this.prisma.category.create({ data: cat });
    }
  }

  async getTree() {
    return this.prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: { where: { isActive: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: { where: { isActive: true } },
        attributes: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category '${slug}' not found`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let level = 1;
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
      level = parent.level + 1;
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        slug,
        level,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, products: { select: { id: true } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.children.length > 0) {
      throw new BadRequestException('Cannot delete category with active subcategories');
    }

    if (category.products.length > 0) {
      throw new BadRequestException('Cannot delete category with associated products');
    }

    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted successfully' };
  }

  async findAll(query: CategoryQueryDto) {
    const where: any = {};
    if (query.parentId) {
      where.parentId = query.parentId;
    } else if (query.rootOnly) {
      where.parentId = null;
    }
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip: query.skip,
        take: query.take,
        include: { children: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      items,
      meta: new PaginationMetaDto(total, query.page ?? 1, query.limit ?? 20),
    };
  }
}
