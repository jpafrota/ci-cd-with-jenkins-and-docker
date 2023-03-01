import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { ListSchedulesQueryParams } from '../dto/list-schedules.request.dto';
import { ListSchedulesResponse } from '../dto/list-schedules.response.dto';
import { ScheduleFactory } from '../utils/schedule.factory';
import scheduleSelectPrismaSQL from '../utils/select-schedule.prisma-sql';

@Injectable()
export class ListSchedulesCommand {
  constructor(private prisma: PrismaService) {}

  async execute(
    query: ListSchedulesQueryParams,
  ): Promise<ListSchedulesResponse> {
    const take = query.pageSize || 10;
    const skip = query.page ? (query.page - 1) * take : 0;

    const where = {
      id_status: query.status,
      start: {
        gte: query.startDate,
        lte: query.endDate,
      },
      OR: [
        {
          student: {
            enrollment: query.studentEnrollment,
          },
        },
        {
          monitor: {
            student: {
              enrollment: query.studentEnrollment,
            },
          },
        },
        {
          student: {
            user: {
              name: {
                contains: query.studentName,
              },
            },
          },
        },
        {
          monitor: {
            student: {
              user: {
                name: {
                  contains: query.studentName,
                },
              },
            },
          },
        },
      ],
      monitor: {
        responsible_professor_id: {
          in: query.responsibleIds,
        },
        subject_id: {
          in: query.subjectIds,
        },
      },
    };

    const response = await this.prisma.scheduleMonitoring.findMany({
      select: scheduleSelectPrismaSQL,
      orderBy: {
        start: query.startDate ? 'asc' : 'desc',
      },
      where,
      skip,
      take,
    });

    const totalItems = await this.prisma.scheduleMonitoring.count({ where });

    return {
      data: response.map((resp) => ScheduleFactory.createFromPrisma(resp)),
      meta: {
        page: query.page || 1,
        pageSize: take,
        totalItems,
        totalPages: Math.ceil(totalItems / take),
      },
    };
  }
}
