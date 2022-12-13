import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Monitor } from '@prisma/client';
import { elementAt } from 'rxjs';
import { QueryPaginationDto } from 'src/common/dto/query-pagination.dto';
import { IResponsePaginate } from 'src/common/interfaces/pagination.interface';
import { pagination } from 'src/common/pagination';
import { PrismaService } from 'src/database/prisma.service';
import { SubjectService } from 'src/subject/subject.service';
import { UserService } from 'src/user/user.service';
import { AcceptMonitoringDto } from './dto/accept-monitoring.dto';
import { RequestMonitoringDto } from './dto/request-monitoring.dto';

@Injectable()
export class MonitorService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly subjectService: SubjectService,
    private readonly userService: UserService,
  ) {}

  async findAll(query: QueryPaginationDto): Promise<IResponsePaginate> {
    const monitors = await this.prismaService.monitor.findMany({
      include: {
        student: { select: { user: true, course: true } },
        subject: true,
        responsible_professor: { select: { user: true } },
      },
    });

    monitors.forEach((element) => {
      delete element.student.user.email;
      delete element.student.user.id;
      delete element.student.user.is_verified;
      delete element.student.user.type_user_id;
      delete element.student.user.updated_at;
      delete element.student.user.created_at;
      delete element.student.user.password;
      delete element.student.course.id;
      delete element.responsible_professor.user.password;
      delete element.responsible_professor.user.id;
      delete element.responsible_professor.user.email;
      delete element.responsible_professor.user.is_verified;
      delete element.responsible_professor.user.type_user_id;
      delete element.responsible_professor.user.updated_at;
      delete element.responsible_professor.user.created_at;
    });
    return pagination(monitors, query);
  }

  async findOne(id: number): Promise<Monitor> {
    const monitor = await this.prismaService.monitor.findUnique({
      where: {
        id,
      },
      include: {
        student: true,
        subject: true,
        responsible_professor: true,
        ScheduleMonitoring: true,
      },
    });
    if (!monitor) {
      throw new NotFoundException('Monitor não encontrado');
    }
    return monitor;
  }

  async requestMonitoring(user_id: number, data: RequestMonitoringDto) {
    const user = await this.userService.findOneById(user_id);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    if (user.type_user_id != 1)
      throw new ForbiddenException('Usuário não é um aluno');

    const subject = await this.subjectService.findOne(data.subject_id);
    if (!subject) throw new NotFoundException('Disciplina não encontrada.');

    const professor = await this.userService.findOneById(data.professor_id);
    console.log(professor);

    if (!professor) throw new NotFoundException('Professor não encontrado.');

    await this.prismaService.monitor.create({
      data: {
        responsible_professor_id: data.professor_id,
        student_id: user_id,
        subject_id: data.subject_id,
      },
    });
    return { message: 'Solicitação enviada!' };
  }

  async acceptMonitoring(user_id: number, body: AcceptMonitoringDto) {
    const professor = await this.userService.findOneById(user_id);

    if (!professor) throw new NotFoundException('Usuário não encontrado.');

    if (professor.type_user_id == 1)
      throw new BadRequestException(
        'Somente professores ou coordenadores podem aceitar solicitações de monitoria.',
      );

    const subject = await this.subjectService.findOne(body.subject_id);

    if (!subject) throw new NotFoundException('Disciplina não encontrada.');

    const user_student = await this.userService.findOneById(user_id);

    if (!user_student) throw new NotFoundException('Aluno não encontrado.');

    const request_monitor = await this.prismaService.monitor.findFirst({
      where: { student_id: body.student_id },
    });

    if (!request_monitor)
      throw new NotFoundException('Solicitação não encontrada!');

    if (
      request_monitor.id_status == 2 &&
      request_monitor.subject_id == body.subject_id
    )
      throw new BadRequestException('Sua solicitacão ja foi aprovada.');

    const response_subject =
      await this.prismaService.subjectResponsability.findFirst({
        where: { subject_id: body.subject_id },
      });

    if (!response_subject)
      throw new BadRequestException(
        'Nenhum professor responsável pela disciplina.',
      );

    if (
      !(
        response_subject.professor_id === user_id ||
        professor.type_user_id === 3
      )
    )
      throw new BadRequestException(
        'Você não possui acesso para aceitar esta solicitacão.',
      );

    await this.prismaService.monitor.update({
      data: { id_status: 2 },
      where: { id: request_monitor.id },
    });

    return { message: 'Solicitacão aceita!' };
  }

  async acceptScheduledMonitoring(schedule_id: number) {
    const schedule = await this.prismaService.scheduleMonitoring.findUnique({
      where: { id: schedule_id },
    });
    if (!schedule) throw new NotFoundException('Agendamento não encontrado');

    await this.prismaService.scheduleMonitoring.update({
      data: { id_status: 2 },
      where: { id: schedule_id },
    });

    return { message: 'Agendamento aceito!' };
  }
}
