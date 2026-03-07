import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkAssignDto } from './dto/bulk-assign.dto';
import { BulkUnassignDto } from './dto/bulk-unassign.dto';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    async bulkAssign(dto: BulkAssignDto) {
        // Verify sales rep exists and is an SR
        const salesRep = await this.prisma.user.findUnique({
            where: { id: dto.sales_rep_id },
        });
        if (!salesRep || salesRep.role !== 'SR') {
            throw new BadRequestException('Invalid sales rep ID or user is not an SR');
        }

        // Verify all retailer IDs exist
        const retailers = await this.prisma.retailer.findMany({
            where: { id: { in: dto.retailer_ids } },
            select: { id: true },
        });
        const validIds = retailers.map((r) => r.id);
        const invalidIds = dto.retailer_ids.filter((id) => !validIds.includes(id));
        if (invalidIds.length > 0) {
            throw new BadRequestException(`Invalid retailer IDs: ${invalidIds.join(', ')}`);
        }

        // Bulk create assignments, skip duplicates
        const result = await this.prisma.salesRepRetailer.createMany({
            data: dto.retailer_ids.map((retailerId) => ({
                salesRepId: dto.sales_rep_id,
                retailerId,
            })),
            skipDuplicates: true,
        });

        return {
            message: `Successfully assigned ${result.count} retailers to sales rep`,
            assigned: result.count,
            skippedDuplicates: dto.retailer_ids.length - result.count,
        };
    }

    async bulkUnassign(dto: BulkUnassignDto) {
        const result = await this.prisma.salesRepRetailer.deleteMany({
            where: {
                salesRepId: dto.sales_rep_id,
                retailerId: { in: dto.retailer_ids },
            },
        });

        return {
            message: `Successfully unassigned ${result.count} retailers from sales rep`,
            unassigned: result.count,
        };
    }

    async importRetailersFromCsv(fileBuffer: Buffer) {
        const records = await this.parseCsv(fileBuffer);

        if (records.length === 0) {
            throw new BadRequestException('CSV file is empty or has no valid rows');
        }

        // Validate required columns
        const requiredColumns = ['uid', 'name', 'phone', 'region_id', 'area_id', 'distributor_id', 'territory_id', 'point_id', 'route_id'];
        const headers = Object.keys(records[0]);
        const missingColumns = requiredColumns.filter((col) => !headers.includes(col));
        if (missingColumns.length > 0) {
            throw new BadRequestException(`Missing required columns: ${missingColumns.join(', ')}`);
        }

        const results = { imported: 0, skipped: 0, errors: [] as string[] };

        // Process in batches of 500
        const batchSize = 500;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const data = batch
                .map((record, idx) => {
                    try {
                        return {
                            uid: String(record.uid).trim(),
                            name: String(record.name).trim(),
                            phone: record.phone ? String(record.phone).trim() : null,
                            regionId: parseInt(record.region_id, 10),
                            areaId: parseInt(record.area_id, 10),
                            distributorId: parseInt(record.distributor_id, 10),
                            territoryId: parseInt(record.territory_id, 10),
                            pointId: parseInt(record.point_id, 10),
                            routeId: parseInt(record.route_id, 10),
                            notes: record.notes ? String(record.notes).trim() : null,
                        };
                    } catch (e) {
                        results.errors.push(`Row ${i + idx + 2}: ${e.message}`);
                        results.skipped++;
                        return null;
                    }
                })
                .filter(Boolean);

            if (data.length > 0) {
                try {
                    const result = await this.prisma.retailer.createMany({
                        data: data as any[],
                        skipDuplicates: true,
                    });
                    results.imported += result.count;
                    results.skipped += data.length - result.count;
                } catch (e) {
                    results.errors.push(`Batch starting at row ${i + 2}: ${e.message}`);
                    results.skipped += data.length;
                }
            }
        }

        return results;
    }

    private parseCsv(buffer: Buffer): Promise<Record<string, string>[]> {
        return new Promise((resolve, reject) => {
            const records: Record<string, string>[] = [];
            const stream = Readable.from(buffer);
            const parser = stream.pipe(
                parse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                }),
            );

            parser.on('data', (record) => records.push(record));
            parser.on('end', () => resolve(records));
            parser.on('error', (err) => reject(err));
        });
    }

    async getAssignments(salesRepId: number) {
        return this.prisma.salesRepRetailer.findMany({
            where: { salesRepId },
            include: {
                retailer: {
                    include: { region: true, area: true, distributor: true, territory: true },
                },
            },
            orderBy: { assignedAt: 'desc' },
        });
    }

    async getSalesReps() {
        return this.prisma.user.findMany({
            where: { role: 'SR' },
            select: {
                id: true,
                username: true,
                name: true,
                phone: true,
                _count: { select: { assignments: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
}
