import { appointmentService } from '../../src/services/appointment.service';
import { acquireLock, releaseLock } from '../../src/config/redis';
import prisma from '../../src/config/database';
import { doctorRepository } from '../../src/repositories/doctor.repository';

// Mock dependencies
jest.mock('../../src/config/database', () => ({
  patient: { findUnique: jest.fn() },
  appointment: { create: jest.fn(), findFirst: jest.fn() },
}));

jest.mock('../../src/repositories/doctor.repository', () => ({
  doctorRepository: {
    findById: jest.fn(),
    getAvailabilityByDay: jest.fn(),
  },
}));

jest.mock('../../src/config/redis', () => ({
  acquireLock: jest.fn(),
  releaseLock: jest.fn(),
  appointmentSlotKey: jest.fn((id, date, time) => `lock:test:${id}:${date}:${time}`),
}));

describe('Appointment Service — Concurrency Slot Lock', () => {
  const mockPatient = { id: 'patient123', userId: 'user123', user: { name: 'John Doe', email: 'john@example.com' } };
  const mockDoctor = { id: 'doc123', userId: 'docUser123', isApproved: true, specialization: 'Cardiology', user: { name: 'Dr. Smith' } };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient);
    (doctorRepository.findById as jest.Mock).mockResolvedValue(mockDoctor);
  });

  it('should throw 409 Conflict if Redis lock fails (Simultaneous booking attempt)', async () => {
    (acquireLock as jest.Mock).mockResolvedValue(false); // Lock failed!

    await expect(
      appointmentService.bookAppointment('user123', {
        doctorId: 'doc123',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        type: 'IN_PERSON',
      })
    ).rejects.toThrow('This slot is currently being processed by another patient');

    expect(acquireLock).toHaveBeenCalled();
  });

  it('should release Redis lock in finally block even if DB validation error occurs after acquiring lock', async () => {
    (acquireLock as jest.Mock).mockResolvedValue(true);
    (doctorRepository.getAvailabilityByDay as jest.Mock).mockResolvedValue(null); // Doctor not available today

    try {
      await appointmentService.bookAppointment('user123', {
        doctorId: 'doc123',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        type: 'IN_PERSON',
      });
    } catch {
      // Expected to fail on availability check
    }

    expect(releaseLock).toHaveBeenCalled();
  });
});
