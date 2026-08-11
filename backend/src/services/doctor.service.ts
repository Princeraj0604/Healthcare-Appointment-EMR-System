import { doctorRepository } from '../repositories/doctor.repository';
import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';
import { GetDoctorsQuery, UpdateDoctorProfileInput, SetAvailabilityInput } from '../validations/doctor.validation';
import { PaginatedResponse } from '../utils/ApiResponse';
import { DayOfWeek, AppointmentStatus } from '@prisma/client';
import { TimeSlot } from '../types/index';

// Helper to convert JavaScript Date day index (0=Sunday) to DayOfWeek enum
const JS_DAY_TO_ENUM: Record<number, DayOfWeek> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
};

// Helper: Convert "HH:MM" string to minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper: Convert minutes from midnight to "HH:MM" string
function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export const doctorService = {
  /**
   * List all doctors with filtering & pagination
   */
  async getDoctors(query: GetDoctorsQuery) {
    const { doctors, total, page, limit } = await doctorRepository.findAll(query);
    return PaginatedResponse.create('Doctors retrieved successfully', doctors, total, page, limit);
  },

  /**
   * Get doctor by ID
   */
  async getDoctorById(id: string) {
    const doctor = await doctorRepository.findById(id);
    if (!doctor) {
      throw ApiError.notFound('Doctor not found');
    }
    return doctor;
  },

  /**
   * Update doctor profile (by logged-in doctor user)
   */
  async updateProfile(userId: string, data: UpdateDoctorProfileInput) {
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw ApiError.notFound('Doctor profile not found for this account');
    }

    return doctorRepository.updateProfile(doctor.id, data);
  },

  /**
   * Set weekly availability schedule for doctor
   */
  async setAvailability(userId: string, input: SetAvailabilityInput) {
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw ApiError.notFound('Doctor profile not found for this account');
    }

    // Validate that startTime < endTime for each schedule
    for (const item of input.schedules) {
      const startMin = timeToMinutes(item.startTime);
      const endMin = timeToMinutes(item.endTime);

      if (startMin >= endMin) {
        throw ApiError.badRequest(
          `Start time (${item.startTime}) must be earlier than end time (${item.endTime}) for ${item.dayOfWeek}`
        );
      }

      if (item.breakStart && item.breakEnd) {
        const breakStartMin = timeToMinutes(item.breakStart);
        const breakEndMin = timeToMinutes(item.breakEnd);

        if (breakStartMin >= breakEndMin || breakStartMin < startMin || breakEndMin > endMin) {
          throw ApiError.badRequest(
            `Break time (${item.breakStart}-${item.breakEnd}) must fall within working hours for ${item.dayOfWeek}`
          );
        }
      }
    }

    await doctorRepository.setAvailability(doctor.id, input.schedules);
    return { message: 'Doctor availability updated successfully' };
  },

  /**
   * Get doctor availability / calculated time slots for a given date (YYYY-MM-DD)
   */
  async getSlotsForDate(doctorId: string, dateStr: string): Promise<TimeSlot[]> {
    const doctor = await doctorRepository.findById(doctorId);
    if (!doctor) {
      throw ApiError.notFound('Doctor not found');
    }

    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      throw ApiError.badRequest('Invalid date format. Use YYYY-MM-DD');
    }

    const dayOfWeek = JS_DAY_TO_ENUM[dateObj.getDay()];
    const availability = await doctorRepository.getAvailabilityByDay(doctorId, dayOfWeek);

    if (!availability || !availability.isActive) {
      return []; // Doctor is not available on this day
    }

    // 1. Generate all theoretical slots based on availability template
    const startMin = timeToMinutes(availability.startTime);
    const endMin = timeToMinutes(availability.endTime);
    const duration = availability.slotDuration;

    const breakStartMin = availability.breakStart ? timeToMinutes(availability.breakStart) : null;
    const breakEndMin = availability.breakEnd ? timeToMinutes(availability.breakEnd) : null;

    const allSlots: { startTime: string; endTime: string }[] = [];

    for (let currentMin = startMin; currentMin + duration <= endMin; currentMin += duration) {
      const slotEndMin = currentMin + duration;

      // Skip if slot overlaps with break time
      if (breakStartMin !== null && breakEndMin !== null) {
        if (currentMin < breakEndMin && slotEndMin > breakStartMin) {
          continue;
        }
      }

      allSlots.push({
        startTime: minutesToTime(currentMin),
        endTime: minutesToTime(slotEndMin),
      });
    }

    // 2. Fetch existing booked appointments for doctor on this specific date
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
      select: {
        scheduledAt: true,
      },
    });

    const bookedTimesSet = new Set<string>();
    existingAppointments.forEach((app) => {
      // Extract HH:MM UTC or local time string
      const appTimeStr = app.scheduledAt.toISOString().substring(11, 16);
      bookedTimesSet.add(appTimeStr);
    });

    // 3. Mark availability on each slot
    return allSlots.map((slot) => ({
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: !bookedTimesSet.has(slot.startTime),
    }));
  },

  /**
   * Get reviews for doctor
   */
  async getDoctorReviews(doctorId: string, page: number = 1, limit: number = 10) {
    const { reviews, total } = await doctorRepository.getReviews(doctorId, page, limit);
    return PaginatedResponse.create('Reviews retrieved successfully', reviews, total, page, limit);
  },
};
